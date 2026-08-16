"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Camera, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import UploadTab from "./UploadTab";
import CameraTab from "./CameraTab";
import LiveTab from "./LiveTab";
import { getStatus, StatusInfo } from "@/lib/api";

const tabs = [
  { id: "upload", label: "Upload Gambar", icon: ImageIcon },
  { id: "camera", label: "Kamera", icon: Camera },
  { id: "live", label: "Live", icon: Video },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function DetectPage() {
  const [tab, setTab] = useState<TabId>("upload");
  const [status, setStatus] = useState<StatusInfo | null>(null);

  useEffect(() => {
    getStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold"
        >
          Deteksi Hama
        </motion.h1>

        {status?.active ? (
          <p className="text-slate-400 mt-2 text-sm">
            Model aktif: <span className="text-green-400 font-medium">{status.active}</span> ·{" "}
            {status.classes.length} kelas
          </p>
        ) : (
          <p className="text-amber-400 mt-2 text-sm">
            Belum ada model aktif — buka menu Model untuk upload file .pt.
          </p>
        )}

        <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                tab === t.id ? "bg-white text-black font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "upload" && <UploadTab hasModel={!!status?.active} />}
          {tab === "camera" && <CameraTab hasModel={!!status?.active} />}
          {tab === "live" && <LiveTab hasModel={!!status?.active} />}
        </div>
      </div>
    </main>
  );
}
