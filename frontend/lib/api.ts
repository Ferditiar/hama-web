export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ModelInfo = {
  name: string;
  size_mb: number;
  classes: string[];
  active: boolean;
};

export type Detection = {
  label: string;
  confidence: number;
  box: [number, number, number, number];
};

export type DetectResult = {
  image: string;
  detections: Detection[];
  model?: string;
};

export type StatusInfo = {
  active: string | null;
  classes: string[];
  model_count: number;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request gagal (${res.status})`);
  }
  return res.json();
}

export async function getStatus(): Promise<StatusInfo> {
  const res = await fetch(`${API_BASE}/status`, { cache: "no-store" });
  return handle(res);
}

export async function listModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${API_BASE}/models`, { cache: "no-store" });
  return handle(res);
}

export async function uploadModel(file: File): Promise<{ name: string; classes: string[] }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/models/upload`, { method: "POST", body: form });
  return handle(res);
}

export async function setActiveModel(name: string): Promise<{ active: string }> {
  const res = await fetch(`${API_BASE}/models/active`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handle(res);
}

export async function deleteModel(name: string): Promise<{ deleted: string }> {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(name)}`, { method: "DELETE" });
  return handle(res);
}

export async function detectImage(file: Blob, conf = 0.25): Promise<DetectResult> {
  const form = new FormData();
  form.append("file", file, "image.jpg");
  const res = await fetch(`${API_BASE}/detect/image?conf=${conf}`, { method: "POST", body: form });
  return handle(res);
}

export async function detectFrame(blob: Blob, conf = 0.25): Promise<DetectResult> {
  const form = new FormData();
  form.append("file", blob, "frame.jpg");
  const res = await fetch(`${API_BASE}/detect/frame?conf=${conf}`, { method: "POST", body: form });
  return handle(res);
}
