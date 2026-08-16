"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/detect", label: "Deteksi" },
  { href: "/dashboard", label: "Model" },
  { href: "/advanced", label: "Advanced" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-md bg-black/20 border-b border-white/10">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
        <Leaf className="w-5 h-5 text-green-400" />
        HAMA AI
      </Link>
      <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                active ? "bg-white text-black font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/detect"
        className="hidden md:inline-flex items-center gap-1 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Mulai Deteksi →
      </Link>
    </header>
  );
}
