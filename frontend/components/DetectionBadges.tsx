import { Detection } from "@/lib/api";

export default function DetectionBadges({ detections }: { detections: Detection[] }) {
  if (detections.length === 0) {
    return <p className="text-sm text-slate-500">Tidak ada hama terdeteksi.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {detections.map((d, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-400/15 text-green-300 border border-green-400/20 px-3 py-1 rounded-full"
        >
          {d.label}
          <span className="text-green-500/70">{Math.round(d.confidence * 100)}%</span>
        </span>
      ))}
    </div>
  );
}
