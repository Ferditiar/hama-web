"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { deleteModel, listModels, ModelInfo, setActiveModel, uploadModel } from "@/lib/api";

export default function Dashboard() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setModels(await listModels());
    } catch {
      setError("Tidak bisa terhubung ke server backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pt")) {
      setError("File harus berformat .pt");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadModel(file);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold"
        >
          Kelola Model
        </motion.h1>
        <p className="text-slate-400 mt-2">
          Upload model hasil training (.pt) kamu sendiri, lalu jadikan aktif untuk deteksi.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-8 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-green-400 bg-green-400/5" : "border-white/15 bg-white/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto text-green-400 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
          )}
          <p className="mt-3 text-sm text-slate-300">
            {uploading ? "Mengupload & memvalidasi model..." : "Klik atau drag file .pt ke sini"}
          </p>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Model Tersedia
          </h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : models.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada model. Upload file .pt di atas.</p>
          ) : (
            models.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{m.name}</p>
                    {m.active && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-400/15 text-green-400 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {m.size_mb} MB · {m.classes.length} kelas: {m.classes.join(", ") || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!m.active && (
                    <button
                      onClick={async () => {
                        await setActiveModel(m.name);
                        refresh();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Aktifkan
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await deleteModel(m.name);
                      refresh();
                    }}
                    className="p-1.5 rounded-full hover:bg-red-400/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
