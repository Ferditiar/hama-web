"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import DetectionBadges from "@/components/DetectionBadges";
import { detectImage, DetectResult } from "@/lib/api";

export default function UploadTab({ hasModel }: { hasModel: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [conf, setConf] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      setResult(await detectImage(file, conf));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deteksi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div
        onClick={() => hasModel && inputRef.current?.click()}
        className={`relative aspect-video rounded-2xl border-2 border-dashed border-white/15 bg-white/5 flex items-center justify-center overflow-hidden ${
          hasModel ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {result ? (
          <img src={`data:image/jpeg;base64,${result.image}`} className="w-full h-full object-contain" />
        ) : preview ? (
          <img src={preview} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-slate-400">
            <UploadCloud className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Klik untuk upload gambar</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 flex justify-between mb-1">
            <span>Confidence</span> <span>{Math.round(conf * 100)}%</span>
          </label>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.05}
            value={conf}
            onChange={(e) => setConf(parseFloat(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Hasil</p>
          {result ? <DetectionBadges detections={result.detections} /> : (
            <p className="text-sm text-slate-500">Upload gambar untuk melihat hasil deteksi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
