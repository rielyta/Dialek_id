# API Contract - Dialek.id Backend

Base URL (lokal): `http://localhost:3000`

## Konvensi Umum

- Semua endpoint di bawah `/api/*` wajib header `Authorization: Bearer <firebaseIdToken>`, kecuali `/health`.
- Format body request dan response: JSON.
- Response sukses:
  ```json
  { "data": { } }
  ```
- Response gagal:
  ```json
  { "error": "NamaError", "message": "Penjelasan untuk pengguna/developer" }
  ```
- Status code yang dipakai:
  - `200 OK`, `201 Created`
  - `400 Bad Request` - input tidak valid
  - `401 Unauthorized` - token tidak ada atau tidak valid
  - `404 Not Found` - data atau endpoint tidak ditemukan
  - `409 Conflict` - data sudah ada atau bentrok (username, email)
  - `500 Internal Server Error`

---

## GET /health

Cek server hidup. Tidak butuh auth.

**Response 200:**
```json
{ "status": "ok" }
```

---

## GET /api/akun

Ambil profil pengguna yang sedang login (dari `uid` di token). Field mengikuti entitas User pada Data Dictionary SWDD.

**Auth:** wajib

**Response 200:**
```json
{
  "data": {
    "uid": "abc123",
    "username": "desi",
    "nama": "Desi Maria Elita Silalahi",
    "email": "desi@example.com",
    "provider": "email",
    "levelBudaya": "Pemula",
    "expPoin": 0,
    "tanggalDaftar": "2026-01-10T00:00:00.000Z"
  }
}
```

**Response 404:**
```json
{ "error": "NotFound", "message": "Profil pengguna tidak ditemukan." }
```

---

## POST /api/akun

Buat profil pengguna di Firestore setelah akun dibuat di Firebase Authentication (FR-01). `email` dan `provider` diambil dari token, sedangkan `levelBudaya`, `expPoin`, dan `tanggalDaftar` diisi otomatis.

**Auth:** wajib

**Request:**
```json
{ "username": "desi", "nama": "Desi Maria Elita Silalahi" }
```

**Response 201:** sama seperti respons GET /api/akun.

**Response 400:** `username` atau `nama` kosong.

**Response 409:** profil sudah ada, atau `username` sudah dipakai.

---

## PUT /api/akun

Ubah data akun (FR-03). Hanya field yang dikirim yang diubah. `email` dan `password` ikut diperbarui di Firebase Authentication. `password` tidak pernah dikembalikan di respons.

**Auth:** wajib

**Request (semua field opsional, minimal satu):**
```json
{
  "username": "desi_m",
  "nama": "Desi M. E. Silalahi",
  "email": "baru@example.com",
  "password": "passwordbaru"
}
```

**Response 200:** sama seperti respons GET /api/akun.

**Response 400:** format email tidak valid, password kurang dari 6 karakter, field kosong, atau tidak ada field yang dikirim.

**Response 404:** profil belum dibuat (gunakan POST /api/akun).

**Response 409:** `username` atau `email` sudah dipakai.

---

## DELETE /api/akun

Hapus akun sendiri (FR-04): akun di Firebase Authentication, profil, serta progres (`Rating`, `HasilLatihan`, `HasilSusunKosakata`) di Firestore. Konfirmasi kata sandi (reauthentication) dilakukan di frontend sebelum memanggil endpoint ini.

**Auth:** wajib

**Response 200:**
```json
{ "data": { "message": "Akun berhasil dihapus." } }
```

---

## GET /api/dashboard

Ringkasan progres belajar pengguna yang sedang login (FR-05, UC-08): level budaya, bar exp, ringkasan kosakata mingguan, progres latihan per materi, dan peringkat Sambung Kata. Pengguna baru menerima nilai awal (nol) tanpa galat (alur A1).

**Auth:** wajib

**Request:** tanpa body

**Response 200:**
```json
{
  "data": {
    "levelBudaya": "Pemula",
    "exp": {
      "expPoin": 40,
      "levelSaatIni": "Pemula",
      "expLevelBerikutnya": 100,
      "persenExp": 40
    },
    "kosakataMingguan": {
      "jumlahKataMingguIni": 12,
      "skorRataRata": 87.5
    },
    "progresLatihan": [
      {
        "materiId": "materi-01",
        "judul": "Kata Ganti Subjek",
        "jumlahSoal": 7,
        "jumlahDikerjakan": 7,
        "skor": 86,
        "selesai": true
      }
    ],
    "peringkatSambungKata": null
  }
}
```

Catatan:
- `kosakataMingguan` menghitung hasil Latihan Susun Kosakata dalam 7 hari terakhir.
- `peringkatSambungKata` bernilai `null` sampai modul Permainan dan Leaderboard tersedia.

---

## GET /api/materi

Daftar materi (FR-06). Filter opsional `?topik=` berdasarkan kategori, contoh `?topik=Tata Bahasa`. Diurutkan berdasarkan `urutan`.

**Auth:** wajib

**Response 200:**
```json
{
  "data": [
    {
      "materiId": "materi-01",
      "judul": "Kata Ganti Subjek",
      "kategori": "Tata Bahasa",
      "urutan": 1,
      "ratingRataRata": 0
    }
  ]
}
```

---

## GET /api/materi/:id

Detail materi beserta soal latihan. `kunciJawaban` tidak pernah dikirim ke klien.

**Auth:** wajib

**Response 200:**
```json
{
  "data": {
    "materiId": "materi-01",
    "judul": "Kata Ganti Subjek",
    "kategori": "Tata Bahasa",
    "isi": "...",
    "urutan": 1,
    "ratingRataRata": 4.5,
    "jumlahRating": 2,
    "ratingSaya": 5,
    "latihan": [
      { "latihanId": "latihan-01", "pertanyaan": "...", "urutan": 1 }
    ]
  }
}
```

**Response 404:** materi tidak ditemukan.

---

## POST /api/materi/:id/rating

Beri atau perbarui rating materi (FR-08). Hanya bisa setelah pengguna menyelesaikan latihan materi tersebut (UC-11). Satu rating per pengguna per materi, dan rata-rata dihitung ulang.

**Auth:** wajib

**Request:**
```json
{ "nilai": 5 }
```

**Response 200:**
```json
{
  "data": {
    "materiId": "materi-01",
    "nilai": 5,
    "ratingRataRata": 5,
    "jumlahRating": 1
  }
}
```

**Response 400:** `nilai` bukan bilangan bulat 1-5.

**Response 403:** pengguna belum mengerjakan latihan materi ini.

**Response 404:** materi tidak ditemukan.

---

## POST /api/materi/:id/latihan/jawaban

Kirim jawaban latihan satu materi (FR-07). Penilaian dilakukan di server: huruf besar atau kecil dan spasi berlebih diabaikan, dan kunci alternatif diterima. Soal yang tidak dijawab dihitung salah. Hasil disimpan di `HasilLatihan` (pengiriman ulang menimpa hasil sebelumnya).

**Auth:** wajib

**Request:**
```json
{
  "jawaban": [
    { "latihanId": "latihan-01", "jawaban": "au" },
    { "latihanId": "latihan-02", "jawaban": "kamu" }
  ]
}
```

**Response 200:**
```json
{
  "data": {
    "materiId": "materi-01",
    "jumlahSoal": 7,
    "jumlahBenar": 1,
    "skor": 14,
    "tersimpan": true,
    "peringatan": null,
    "hasil": [
      {
        "latihanId": "latihan-01",
        "pertanyaan": "Apa bahasa Batak Toba untuk 'aku'?",
        "jawabanKamu": "au",
        "benar": true,
        "kunciJawaban": "ahu",
        "pembahasan": "Ahu berarti 'aku'. Di beberapa daerah dibaca au."
      }
    ]
  }
}
```

Jika penyimpanan hasil gagal (UC-10 alur A2), skor tetap dikembalikan dengan `tersimpan: false` dan `peringatan` berisi pesan galat.

**Response 400:** `jawaban` bukan array, formatnya salah, `latihanId` tidak ada pada materi tersebut, atau ada soal yang belum dijawab:
```json
{
  "error": "BadRequest",
  "message": "Ada soal yang belum dijawab. Lengkapi semua jawaban sebelum mengirim.",
  "belumDijawab": ["latihan-02", "latihan-03"]
}
```

**Response 404:** materi tidak ditemukan.

---

## GET /api/susun-kosakata/soal

Ambil satu kosakata acak untuk Latihan Susun Kosakata (FR-09, UC-12). Huruf kata Batak diacak oleh server dan kata aslinya tidak dikirim.

**Auth:** wajib

**Response 200:**
```json
{
  "data": {
    "kosakataId": "manuhor",
    "kataIndonesia": "membeli",
    "kategori": "action",
    "jumlahHuruf": 7,
    "hurufAcak": ["h", "u", "n", "a", "r", "o", "m"]
  }
}
```

**Response 404:** data kosakata belum tersedia.

---

## POST /api/susun-kosakata/jawab

Kirim susunan huruf pengguna. Fuzzy Match Engine menghitung skor kemiripan 0-100 dengan rumus `(1 - jarak Levenshtein / panjang maksimum) x 100` di server. Skor berapa pun tetap disimpan ke `HasilSusunKosakata`, dan pengguna selalu dapat melanjutkan (UC-12 A1). Jawaban dianggap benar jika skor mencapai ambang batas 85.

**Auth:** wajib

**Request:**
```json
{ "kosakataId": "manuhor", "jawaban": "manuhor" }
```

**Response 200:**
```json
{
  "data": {
    "kosakataId": "manuhor",
    "skor": 100,
    "benar": true,
    "ambangBatas": 85,
    "kataBenar": "manuhor",
    "tersimpan": true
  }
}
```

**Response 400:** `kosakataId` atau `jawaban` kosong.

**Response 404:** kosakata tidak ditemukan.

**Response 503:** Fuzzy Match Engine tidak merespons, jawaban tidak dinilai (UC-12 A2).

---

## GET /api/susun-kosakata/ringkasan

Ringkasan skor pengguna pada Latihan Susun Kosakata.

**Auth:** wajib

**Response 200:**
```json
{
  "data": {
    "jumlahJawaban": 12,
    "jumlahBenar": 8,
    "skorRataRata": 87.5,
    "skorTertinggi": 100,
    "ambangBatas": 85
  }
}
```