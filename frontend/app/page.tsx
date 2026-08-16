"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ScanEye, Camera, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1120]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-green-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b1120]" />
      </div>

      <Navbar />

      <section className="relative z-10 flex flex-col justify-end min-h-screen px-6 md:px-10 pb-16 pt-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 self-start mb-6 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-green-300"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ditenagai model YOLO custom kamu sendiri
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-semibold tracking-tight text-white max-w-3xl leading-[1.05]"
        >
          Deteksi Hama Tanaman <span className="text-green-400">Secara Instan</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-slate-300 text-lg max-w-xl"
        >
          Upload model hasil training kamu, lalu deteksi hama lewat kamera, foto,
          atau video real-time — langsung dari browser.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/detect"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-green-400 transition-colors"
          >
            Mulai Deteksi <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
          >
            Kelola Model
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl"
        >
          {[
            { icon: Camera, title: "Kamera", desc: "Foto instan, deteksi seketika" },
            { icon: ScanEye, title: "Live Stream", desc: "Pantau real-time dari webcam" },
            { icon: Sparkles, title: "Model Sendiri", desc: "Upload file .pt hasil training" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
            >
              <f.icon className="w-5 h-5 text-green-400 mb-3" />
              <p className="text-white font-medium">{f.title}</p>
              <p className="text-slate-400 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
