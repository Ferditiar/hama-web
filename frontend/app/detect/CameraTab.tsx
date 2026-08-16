"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import DetectionBadges from "@/components/DetectionBadges";
import { detectImage, DetectResult } from "@/lib/api";

export default function CameraTab({ hasModel }: { hasModel: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [conf, setConf] = useState(0.25);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      })
      .catch(() => setError("Tidak bisa mengakses kamera. Izinkan akses kamera di browser."));
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setLoading(true);
      setError(null);
      try {
        setResult(await detectImage(blob, conf));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Deteksi gagal");
      } finally {
        setLoading(false);
      }
    }, "image/jpeg");
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
        {result ? (
          <img src={`data:image/jpeg;base64,${result.image}`} className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-6 text-center text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
          {result ? (
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-2.5 rounded-full text-sm hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Ambil Lagi
            </button>
          ) : (
            <button
              onClick={capture}
              disabled={!ready || !hasModel}
              className="flex items-center gap-2 bg-green-500 text-black font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-green-400 transition-colors disabled:opacity-40"
            >
              <Camera className="w-4 h-4" /> Ambil Foto
            </button>
          )}
        </div>
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
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Hasil</p>
          {result ? (
            <DetectionBadges detections={result.detections} />
          ) : (
            <p className="text-sm text-slate-500">Ambil foto untuk melihat hasil deteksi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
