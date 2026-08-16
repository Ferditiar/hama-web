import { API_BASE } from "./api";

export type TrainStatus = {
  running: boolean;
  log: string;
  run_name: string | null;
  error: string | null;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request gagal (${res.status})`);
  }
  return res.json();
}

export async function uploadDataset(file: File): Promise<{ dataset: string; yaml: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/dataset/upload`, { method: "POST", body: form });
  return handle(res);
}

export async function startTraining(baseModel: string, yaml: string, epochs: number, imgsz: number) {
  const res = await fetch(`${API_BASE}/dataset/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_model: baseModel, yaml, epochs, imgsz }),
  });
  return handle(res);
}

export async function trainingStatus(): Promise<TrainStatus> {
  const res = await fetch(`${API_BASE}/dataset/train/status`, { cache: "no-store" });
  return handle(res);
}
