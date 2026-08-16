"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import DetectionBadges from "@/components/DetectionBadges";
import { Detection, detectFrame } from "@/lib/api";

export default function LiveTab({ hasModel }: { hasModel: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [conf, setConf] = useState(0.25);
  const [annotated, setAnnotated] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      runningRef.current = true;
      setRunning(true);
      loop();
    } catch {
      setError("Tidak bisa mengakses kamera.");
    }
  }

  function stop() {
    runningRef.current = false;
    setRunning(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function loop() {
    while (runningRef.current) {
      if (!busyRef.current) {
        busyRef.current = true;
        await captureAndDetect();
        busyRef.current = false;
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  async function captureAndDetect() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob) return;
    const t0 = performance.now();
    try {
      const res = await detectFrame(blob, conf);
      setAnnotated(res.image);
      setDetections(res.detections);
      const dt = performance.now() - t0;
      setFps(Math.round(1000 / Math.max(dt, 1)));
    } catch {
      /* skip frame errors silently while streaming */
    }
  }

  useEffect(() => stop, []);

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-0 absolute" />
        <canvas ref={canvasRef} className="hidden" />
        {annotated ? (
          <img src={`data:image/jpeg;base64,${annotated}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            {running ? "Menghubungkan kamera..." : "Kamera belum aktif"}
          </div>
        )}

        {running && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full text-xs">
            <span className="relative w-2 h-2">
              <span className="live-ring absolute inset-0" />
              <span className="relative block w-2 h-2 rounded-full bg-green-400" />
            </span>
            LIVE · {fps} fps
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-6 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="absolute bottom-4 inset-x-0 flex justify-center">
          {running ? (
            <button
              onClick={stop}
              className="flex items-center gap-2 bg-red-500 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-red-400 transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          ) : (
            <button
              onClick={start}
              disabled={!hasModel}
              className="flex items-center gap-2 bg-green-500 text-black font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-green-400 transition-colors disabled:opacity-40"
            >
              <Play className="w-4 h-4" /> Mulai Live
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
          <DetectionBadges detections={detections} />
        </div>
      </div>
    </div>
  );
}
