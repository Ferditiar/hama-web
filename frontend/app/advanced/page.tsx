"use client";

import { useEffect, useState } from "react";
import { Database, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { listModels, ModelInfo } from "@/lib/api";
import { startTraining, trainingStatus, uploadDataset } from "@/lib/dataset-api";

export default function Advanced() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [yaml, setYaml] = useState<string | null>(null);
  const [base, setBase] = useState("");
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listModels().then((items) => {
      setModels(items);
      setBase(items.find((m) => m.active)?.name ?? items[0]?.name ?? "");
    }).catch(() => setMessage("Backend belum tersedia."));
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      const status = await trainingStatus();
      setLog(status.log);
      if (!status.running) {
        setRunning(false);
        setMessage(status.error ? `Gagal: ${status.error}` : "Training selesai. Cek folder runs di backend.");
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [running]);

  async function handleDataset(file: File) {
    setFile(file);
    setMessage("Mengupload dataset...");
    try {
      const result = await uploadDataset(file);
      setYaml(result.yaml);
      setMessage(`Dataset siap: ${result.dataset}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload dataset gagal");
    }
  }

  async function train() {
    if (!yaml || !base) return;
    setMessage(null);
    setLog("");
    await startTraining(base, yaml, epochs, imgsz);
    setRunning(true);
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-3xl font-semibold">Dataset & Retrain</h1>
        <p className="text-slate-400 mt-2">Fitur lanjutan untuk melatih ulang model dengan dataset YOLO baru.</p>
        <div className="mt-6 p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 text-sm text-amber-300">
          Untuk deteksi biasa, kamu tidak perlu dataset. Cukup upload model <b>.pt</b> di halaman Model.
        </div>

        <div className="mt-8 space-y-6">
          <label className="block rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-8 text-center cursor-pointer hover:border-green-400/50 transition-colors">
            <input type="file" accept=".zip" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleDataset(f);
            }} />
            <Database className="w-8 h-8 mx-auto text-green-400" />
            <p className="mt-2 text-sm">{file ? file.name : "Upload dataset .zip berisi data.yaml"}</p>
            <p className="text-xs text-slate-500 mt-1">Format YOLO: images, labels, data.yaml</p>
          </label>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm text-slate-400">Base model
              <select value={base} onChange={(e) => setBase(e.target.value)} className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white">
                {models.map((m) => <option key={m.name} value={m.name} className="bg-slate-900">{m.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-400">Epochs
              <input type="number" min={1} max={100} value={epochs} onChange={(e) => setEpochs(+e.target.value)} className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white" />
            </label>
            <label className="text-sm text-slate-400">Image size
              <input type="number" min={320} max={1280} step={32} value={imgsz} onChange={(e) => setImgsz(+e.target.value)} className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white" />
            </label>
          </div>

          <button onClick={train} disabled={!yaml || running} className="inline-flex items-center gap-2 bg-green-500 text-black font-semibold px-5 py-2.5 rounded-full disabled:opacity-40 hover:bg-green-400 transition-colors">
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            {running ? "Training berjalan..." : "Mulai Retrain"}
          </button>

          {message && <p className="text-sm text-slate-300">{message}</p>}
          {log && <pre className="max-h-56 overflow-auto rounded-xl bg-black/30 border border-white/10 p-4 text-xs text-slate-400 whitespace-pre-wrap">{log}</pre>}
        </div>
      </div>
    </main>
  );
}
