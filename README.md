# 🌿 Hama Web — Deteksi Hama Tanaman

Web untuk mendeteksi hama tanaman secara instan menggunakan model **YOLO** hasil training kamu sendiri. Upload file model `.pt`, lalu deteksi lewat **kamera**, **upload gambar**, atau **live streaming** langsung dari browser.

## ✨ Fitur

- **Upload Model** — upload file `.pt` hasil training, validasi otomatis, dan jadikan model aktif
- **Deteksi Kamera** — ambil foto langsung, deteksi seketika
- **Deteksi Upload Gambar** — unggah foto tanaman untuk dianalisis
- **Live Kamera** — pantau hama secara real-time dari webcam
- **Dataset & Retrain** *(Advanced)* — latih ulang model dengan dataset YOLO baru

## 🛠️ Tech Stack

| Layer     | Teknologi                                      |
|-----------|------------------------------------------------|
| Frontend  | Next.js, React, TypeScript, Tailwind CSS, Framer Motion |
| Backend   | Python, FastAPI, Uvicorn                       |
| AI        | Ultralytics YOLO, OpenCV, Pillow, NumPy        |

## 📁 Struktur

```
hama-web/
├── frontend/            # Next.js web app
│   └── app/             # halaman: beranda, detect, dashboard, advanced
├── backend/
│   ├── main.py          # FastAPI: model & deteksi API
│   ├── models_store/    # model .pt (di-ignore, upload lewat web)
│   ├── datasets/        # dataset upload (di-ignore)
│   └── runs/            # hasil training (di-ignore)
└── start.bat            # jalankan backend + frontend sekali klik (Windows)
```

## 🚀 Cara Menjalankan

### Windows (mudah)
1. Instal dependensi (sekali saja):
   ```powershell
   cd backend
   pip install -r requirements.txt
   cd ..\frontend
   npm install
   ```
2. Jalankan semua (backend + frontend + buka browser):
   ```
   double-click start.bat
   ```
   atau manual via 2 terminal:

   ```powershell
   # Terminal 1 — Backend (port 8000)
   cd backend
   python -m uvicorn main:app --port 8000

   # Terminal 2 — Frontend (port 3000)
   cd frontend
   npm run dev
   ```
3. Buka **http://localhost:3000**

### Linux / macOS
```bash
# Terminal 1
cd backend && python -m uvicorn main:app --port 8000
# Terminal 2
cd frontend && npm run dev
```

## 📌 Catatan

- Model `.pt` **tidak di-commit** ke git (file besar). Upload model lewat menu **Model** di web.
- Untuk deteksi biasa kamu **tidak butuh dataset** — cukup model `.pt`.
- Dataset & Retrain hanya diperlukan jika ingin membuat/memperbaiki model baru.