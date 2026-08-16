import base64
import json
import threading
import time
import zipfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

ROOT = Path(__file__).parent
MODELS_DIR = ROOT / "models_store"
DATASETS_DIR = ROOT / "datasets"
RUNS_DIR = ROOT / "runs"
STATE_FILE = ROOT / "state.json"
MODELS_DIR.mkdir(exist_ok=True)
DATASETS_DIR.mkdir(exist_ok=True)
RUNS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Hama Detect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model_cache: dict[str, YOLO] = {}


def _load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"active": None}


def _save_state(data: dict):
    STATE_FILE.write_text(json.dumps(data))


def _get_active_name() -> Optional[str]:
    state = _load_state()
    name = state.get("active")
    if name and (MODELS_DIR / name).exists():
        return name
    pts = sorted(MODELS_DIR.glob("*.pt"))
    return pts[0].name if pts else None


def _get_model(name: str) -> YOLO:
    if name not in _model_cache:
        _model_cache[name] = YOLO(str(MODELS_DIR / name))
    return _model_cache[name]


def _detect(model: YOLO, image: np.ndarray, conf: float):
    results = model.predict(image, conf=conf, verbose=False)[0]
    plotted = results.plot()
    annotated_rgb = cv2.cvtColor(plotted, cv2.COLOR_BGR2RGB)
    _, buf = cv2.imencode(".jpg", cv2.cvtColor(annotated_rgb, cv2.COLOR_RGB2BGR))
    img_b64 = base64.b64encode(buf).decode()

    detections = []
    names = results.names
    for box in results.boxes:
        cls = int(box.cls[0])
        xyxy = [round(float(v), 2) for v in box.xyxy[0].tolist()]
        detections.append({
            "label": names.get(cls, str(cls)),
            "confidence": round(float(box.conf[0]), 4),
            "box": xyxy,
        })
    return img_b64, detections


# ─── MODELS ──────────────────────────────────────────────────────────────────

@app.get("/models")
def list_models():
    active = _get_active_name()
    models = []
    for f in sorted(MODELS_DIR.glob("*.pt")):
        try:
            m = _get_model(f.name)
            classes = list(m.names.values())
        except Exception:
            classes = []
        models.append({
            "name": f.name,
            "size_mb": round(f.stat().st_size / 1_000_000, 1),
            "classes": classes,
            "active": f.name == active,
        })
    return models


@app.post("/models/upload")
async def upload_model(file: UploadFile = File(...)):
    if not file.filename.endswith(".pt"):
        raise HTTPException(400, "Hanya file .pt yang diizinkan.")
    safe_name = Path(file.filename).name
    target = MODELS_DIR / safe_name
    content = await file.read()
    target.write_bytes(content)
    try:
        m = YOLO(str(target))
        _ = m.names
    except Exception as e:
        target.unlink(missing_ok=True)
        raise HTTPException(422, f"File bukan model YOLO yang valid: {e}")
    _model_cache[safe_name] = m
    state = _load_state()
    state["active"] = safe_name
    _save_state(state)
    return {"name": safe_name, "classes": list(m.names.values())}


@app.post("/models/active")
def set_active(body: dict):
    name = body.get("name")
    if not name or not (MODELS_DIR / name).exists():
        raise HTTPException(404, "Model tidak ditemukan.")
    state = _load_state()
    state["active"] = name
    _save_state(state)
    return {"active": name}


@app.delete("/models/{name}")
def delete_model(name: str):
    path = MODELS_DIR / name
    if not path.exists():
        raise HTTPException(404, "Model tidak ditemukan.")
    path.unlink()
    _model_cache.pop(name, None)
    state = _load_state()
    if state.get("active") == name:
        pts = sorted(MODELS_DIR.glob("*.pt"))
        state["active"] = pts[0].name if pts else None
        _save_state(state)
    return {"deleted": name}


# ─── DETECT ──────────────────────────────────────────────────────────────────

@app.post("/detect/image")
async def detect_image(file: UploadFile = File(...), conf: float = 0.25):
    active = _get_active_name()
    if not active:
        raise HTTPException(400, "Belum ada model aktif.")
    model = _get_model(active)
    content = await file.read()
    arr = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(422, "File gambar tidak valid.")
    img_b64, detections = _detect(model, image, conf)
    return {"image": img_b64, "detections": detections, "model": active}


@app.post("/detect/frame")
async def detect_frame(file: UploadFile = File(...), conf: float = 0.25):
    active = _get_active_name()
    if not active:
        raise HTTPException(400, "Belum ada model aktif.")
    model = _get_model(active)
    content = await file.read()
    arr = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(422, "Frame tidak valid.")
    img_b64, detections = _detect(model, image, conf)
    return {"image": img_b64, "detections": detections}


@app.get("/status")
def status():
    active = _get_active_name()
    if not active:
        return {"active": None, "classes": [], "model_count": len(list(MODELS_DIR.glob("*.pt")))}
    m = _get_model(active)
    return {
        "active": active,
        "classes": list(m.names.values()),
        "model_count": len(list(MODELS_DIR.glob("*.pt"))),
    }


# ─── DATASET & RETRAIN ───────────────────────────────────────────────────────

_train_state = {"running": False, "log": "", "run_name": None, "error": None}


def _find_yaml(path: Path) -> Optional[Path]:
    if path.is_file() and path.suffix.lower() in {".yaml", ".yml"}:
        return path
    matches = list(path.rglob("*.yaml")) + list(path.rglob("*.yml"))
    return matches[0] if matches else None


def _run_training(base_model_name: str, yaml_path: Path, epochs: int, imgsz: int):
    _train_state.update(running=True, log="Memulai training...\n", error=None)
    run_name = f"retrain_{int(time.time())}"
    _train_state["run_name"] = run_name
    try:
        model = YOLO(str(MODELS_DIR / base_model_name))
        model.train(
            data=str(yaml_path),
            epochs=epochs,
            imgsz=imgsz,
            project=str(RUNS_DIR),
            name=run_name,
            exist_ok=True,
        )
        _train_state["log"] += f"Selesai. Bobot baru di runs/{run_name}/weights/best.pt\n"
    except Exception as e:
        _train_state["error"] = str(e)
        _train_state["log"] += f"Gagal: {e}\n"
    finally:
        _train_state["running"] = False


@app.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(400, "Hanya file .zip yang diizinkan.")
    safe_name = Path(file.filename).name
    target = DATASETS_DIR / safe_name
    target.write_bytes(await file.read())
    extract_dir = DATASETS_DIR / target.stem
    extract_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(target) as zf:
        zf.extractall(extract_dir)
    yaml_path = _find_yaml(extract_dir)
    if not yaml_path:
        raise HTTPException(422, "Tidak ditemukan file data.yaml di dalam dataset.")
    return {"dataset": extract_dir.name, "yaml": str(yaml_path.relative_to(ROOT))}


@app.post("/dataset/train")
def start_training(body: dict):
    if _train_state["running"]:
        raise HTTPException(409, "Training lain sedang berjalan.")
    base_model = body.get("base_model")
    dataset_yaml = body.get("yaml")
    epochs = int(body.get("epochs", 30))
    imgsz = int(body.get("imgsz", 640))
    if not base_model or not (MODELS_DIR / base_model).exists():
        raise HTTPException(400, "Model dasar tidak valid.")
    yaml_path = ROOT / dataset_yaml
    if not yaml_path.exists():
        raise HTTPException(400, "File yaml dataset tidak ditemukan.")
    thread = threading.Thread(target=_run_training, args=(base_model, yaml_path, epochs, imgsz), daemon=True)
    thread.start()
    return {"started": True}


@app.get("/dataset/train/status")
def training_status():
    return _train_state
