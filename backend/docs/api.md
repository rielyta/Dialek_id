# API Contract - Dialek.id Backend

Base URL (lokal): `http://localhost:3000`

## Konvensi Umum

- Semua endpoint di bawah `/api/*` wajib header `Authorization: Bearer <firebaseIdToken>`, kecuali `/health`.
- Format body request/response: JSON.
- Response sukses:
  { "data": { ... } }
- Response gagal:
  { "error": "NamaError", "message": "Penjelasan untuk pengguna/developer" }
- Status code: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

## GET /api/akun
Ambil profil pengguna yang sedang login (dari uid di token).
Auth: wajib. Request: tanpa body.

Response 200:
{
  "data": {
    "uid": "abc123",
    "nama": "Desi Maria Elita Silalahi",
    "email": "desi@example.com",
    "fotoProfil": "https://.../foto.jpg",
    "levelBahasa": "Pemula",
    "tanggalBergabung": "2026-01-10T00:00:00.000Z"
  }
}

Response 404: { "error": "NotFound", "message": "Profil pengguna tidak ditemukan." }

## PUT /api/akun
Ubah data profil pengguna yang sedang login. Hanya field yang dikirim yang diubah.
Auth: wajib.

Request:
{ "nama": "Desi M. E. Silalahi", "fotoProfil": "https://.../foto-baru.jpg", "levelBahasa": "Menengah" }

Response 200: field terbaru dari dokumen user.
Response 400: { "error": "BadRequest", "message": "Field nama tidak boleh kosong." }

## GET /api/dashboard
Ringkasan progres belajar pengguna yang sedang login.
Auth: wajib. Request: tanpa body.

Response 200:
{
  "data": {
    "totalKosakataDipelajari": 42,
    "skorRataRataKosakata": 87.5,
    "progresMateri": [
      { "materiId": "materi-01", "judul": "Salam & Perkenalan", "persenSelesai": 100 },
      { "materiId": "materi-02", "judul": "Angka", "persenSelesai": 60 }
    ],
    "permainanDimenangkan": 5,
    "peringkatLeaderboard": 12
  }
}