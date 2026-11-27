# Dialek.id

Platform belajar bahasa Batak Toba. Proyek mata kuliah Proyek Perangkat Lunak, Program Studi S1 Ilmu Komputer, Universitas Sumatera Utara.

## Teknologi

- Frontend: React, Tailwind CSS, Vite
- Backend: Express.js
- Autentikasi dan basis data: Firebase Authentication dan Firestore
- Chatbot: Gemini API

## Struktur folder

```
backend/    REST API (Express.js)
frontend/   Aplikasi web (React)
tools/      get-id-token.html, untuk mengambil ID token saat menguji API
```

## Prasyarat

- Node.js 20 atau lebih baru
- Proyek Firebase dengan Authentication dan Firestore aktif
- Kunci API Gemini dari proyek tanpa penagihan (untuk Chatbot)

## Menjalankan backend

```
cd backend
npm install
npm start
```

Server berjalan di `http://localhost:3000`. Untuk mode pengembangan dengan muat ulang otomatis, pakai `npm run dev`. Setelah mengubah kode atau `.env`, mulai ulang server.

Buat berkas `backend/.env`:

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
PORT=3000
FIREBASE_WEB_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
FUZZY_AMBANG_BATAS=80
CHATBOT_BATAS_WAKTU_MS=2000
```

Tiga variabel Firebase pertama diambil dari kunci akun layanan (service account) proyek Firebase. `FIREBASE_WEB_API_KEY` adalah Web API Key proyek (Project settings, General) dan wajib untuk login dengan username. Variabel lainnya opsional dan memakai nilai bawaan seperti di atas.

## Pengujian

```
cd backend
npm test
```

Perintah ini menjalankan 38 uji dengan node:test: Fuzzy Match Engine, login username, dan permainan sambung kata beserta leaderboard. Uji endpoint dilakukan dengan Postman memakai ID token Firebase (berlaku sekitar satu jam), yang bisa diambil lewat `tools/get-id-token.html`.

## Menjalankan frontend

```
cd frontend
npm install
npm run dev
```

Buat berkas `frontend/.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:3000
```

## Mengisi data awal

Skrip di `backend/scripts` mengisi Firestore memakai kredensial pada `backend/.env`, sehingga data masuk ke proyek Firebase yang sama dengan kredensial itu. Skrip aman dijalankan ulang karena memakai `merge`.

```
cd backend
node scripts/seedMateri.js
node scripts/seedLiterasiBudaya.js
```

## Deployment

- Frontend: Vercel. Isi `VITE_API_URL` dengan URL backend dan semua variabel `VITE_FIREBASE_*`. Tambahkan domain Vercel ke Firebase Authentication, Settings, Authorized domains.
- Backend: Render (paket gratis, tidur setelah 15 menit tanpa aktivitas). Isi semua variabel pada `backend/.env` di pengaturan Environment Render.

## Dokumentasi API

Daftar endpoint, format request, dan respons ada di `backend/docs/api.md`.

## Tim

- Fikri Tamimi (Manajer proyek)
- Desi Maria Elita Silalahi (Backend)
- Charissa Haya Qanita (Frontend)
- Diva Syakirahana (Machine learning)