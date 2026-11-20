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
  - `403 Forbidden` - aksi belum diizinkan (contoh: rating sebelum mengerjakan latihan)
  - `404 Not Found` - data atau endpoint tidak ditemukan
  - `409 Conflict` - data sudah ada atau bentrok (username, email)
  - `500 Internal Server Error`
  - `503 Service Unavailable` - layanan pendukung tidak merespons (Fuzzy Match Engine)

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

Hapus akun sendiri (FR-04): akun di Firebase Authentication, profil, serta progres (`Rating`, `HasilLatihan`, `HasilSusunKosakata`) di Firestore. Progres Literasi Budaya tersimpan di dokumen profil, sehingga ikut terhapus. Konfirmasi kata sandi (reauthentication) dilakukan di frontend sebelum memanggil endpoint ini.

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
- `levelBudaya` naik sesuai jumlah konten Literasi Budaya yang sudah ditandai selesai (lihat `POST /api/literasi-budaya/:id/selesai`). Bernilai `Pemula`, `Menengah`, atau `Mahir`.
- `kosakataMingguan` menghitung hasil Latihan Susun Kosakata dalam 7 hari terakhir.
- `peringkatSambungKata` berisi `{ "peringkat": 3, "skorTertinggi": 40 }`, atau `null` bila pengguna belum pernah menyelesaikan sesi Sambung Kata.

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

---

## POST /api/permainan/mulai

Mulai sesi permainan Sambung Kata (FR-14, UC-14). Sistem memilih kata awal acak dari koleksi `Kosakata` dan membuat sesi di `Permainan/{sesiId}`.

**Auth:** wajib

**Request:** tanpa body

**Response 201:**
```json
{
  "data": {
    "sesiId": "abc123",
    "status": "berjalan",
    "skor": 0,
    "jumlahKata": 1,
    "kataTerpakai": ["horas"],
    "kataTerakhir": "horas",
    "hurufBerikutnya": "s",
    "alasanSelesai": null,
    "waktuMulai": "2026-11-16T03:00:00.000Z",
    "waktuSelesai": null,
    "kataAwal": "horas"
  }
}
```

**Response 500:** data kosakata belum tersedia.

---

## POST /api/permainan/:sesiId/jawaban

Kirim kata sambungan. Kata harus diawali huruf terakhir kata sebelumnya, ada di koleksi `Kosakata`, dan belum dipakai pada sesi yang sama. Huruf besar atau kecil dan spasi berlebih diabaikan. Validasi dan skor dihitung di server.

- Kata valid: skor bertambah 10, lalu sistem menyambung dengan `kataSistem`.
- Kata tidak valid: sesi berakhir, skor akhir disimpan, dan `Leaderboard/{uid}` diperbarui bila skornya melampaui skor tertinggi pemain (UC-14 alur A1).

**Auth:** wajib

**Request:**
```json
{ "kata": "sada" }
```

**Response 200 (kata valid):**
```json
{
  "data": {
    "valid": true,
    "alasan": null,
    "kataSistem": "aek",
    "rekorBaru": false,
    "sesi": {
      "sesiId": "abc123",
      "status": "berjalan",
      "skor": 10,
      "jumlahKata": 3,
      "kataTerpakai": ["horas", "sada", "aek"],
      "kataTerakhir": "aek",
      "hurufBerikutnya": "k",
      "alasanSelesai": null,
      "waktuMulai": "2026-11-16T03:00:00.000Z",
      "waktuSelesai": null
    }
  }
}
```

**Response 200 (kata tidak valid, sesi berakhir):**
```json
{
  "data": {
    "valid": false,
    "alasan": "tidak_sesuai_aturan_sambung",
    "kataSistem": null,
    "rekorBaru": true,
    "sesi": {
      "sesiId": "abc123",
      "status": "selesai",
      "skor": 10,
      "jumlahKata": 3,
      "kataTerpakai": ["horas", "sada", "aek"],
      "kataTerakhir": "aek",
      "hurufBerikutnya": "k",
      "alasanSelesai": "tidak_sesuai_aturan_sambung",
      "waktuMulai": "2026-11-16T03:00:00.000Z",
      "waktuSelesai": "2026-11-16T03:01:00.000Z"
    }
  }
}
```

Nilai `alasan` saat `valid` bernilai false:
- `tidak_sesuai_aturan_sambung`: huruf awal kata bukan huruf terakhir kata sebelumnya.
- `sudah_dipakai`: kata sudah dipakai pada sesi ini.
- `tidak_ada_di_kosakata`: kata tidak ditemukan di koleksi `Kosakata`.

Jika sistem tidak punya kata lanjutan lagi, `valid` bernilai true, `kataSistem` bernilai `null`, dan sesi selesai dengan `alasanSelesai` berisi `sistem_kehabisan_kata`.

**Response 400:** `kata` kosong, bukan teks, atau lebih dari 50 karakter.

**Response 403:** sesi bukan milik pengguna.

**Response 404:** sesi tidak ditemukan.

**Response 409:** sesi sudah berakhir.

---

## POST /api/permainan/:sesiId/akhiri

Akhiri sesi atas permintaan pemain. Skor akhir disimpan dan `Leaderboard/{uid}` diperbarui bila skornya melampaui skor tertinggi pemain.

**Auth:** wajib

**Request:** tanpa body

**Response 200:**
```json
{
  "data": {
    "rekorBaru": true,
    "sesi": {
      "sesiId": "abc123",
      "status": "selesai",
      "skor": 30,
      "jumlahKata": 7,
      "kataTerpakai": ["horas", "sada", "aek", "kata", "asa", "anak", "kapal"],
      "kataTerakhir": "kapal",
      "hurufBerikutnya": "l",
      "alasanSelesai": "dihentikan_pemain",
      "waktuMulai": "2026-11-16T03:00:00.000Z",
      "waktuSelesai": "2026-11-16T03:02:00.000Z"
    }
  }
}
```

**Response 403:** sesi bukan milik pengguna.

**Response 404:** sesi tidak ditemukan.

**Response 409:** sesi sudah berakhir.

---

## GET /api/leaderboard

Peringkat pemain Sambung Kata berdasarkan skor tertinggi (FR-15, UC-15). Skor yang sama berbagi peringkat yang sama (1, 2, 2, 4). `nama` bernilai `null` bila pemain belum punya dokumen di koleksi `Users`.

**Auth:** wajib

**Query:** `limit` opsional, bilangan bulat 1 sampai 50 (bawaan 10).

**Response 200:**
```json
{
  "data": {
    "peringkat": [
      { "peringkat": 1, "uid": "abc123", "nama": "Desi", "skorTertinggi": 50 },
      { "peringkat": 2, "uid": "def456", "nama": "Ani", "skorTertinggi": 30 }
    ],
    "saya": { "peringkat": 2, "uid": "def456", "nama": "Ani", "skorTertinggi": 30 }
  }
}
```

`saya` bernilai `null` bila pengguna belum punya skor di Leaderboard. Daftar `peringkat` kosong (`[]`) bila belum ada yang bermain (UC-15 alur A1).

**Response 400:** `limit` bukan bilangan bulat 1 sampai 50.

---

## GET /api/literasi-budaya

Daftar konten Literasi Budaya Batak Toba (FR-16, UC-16). Diurutkan berdasarkan `urutan`. Isi lengkap tidak dikirim di daftar, hanya di detail. `selesai` menandakan apakah pengguna sudah menandai konten tersebut selesai dibaca.

**Auth:** wajib

**Query:** `kategori` opsional, contoh `?kategori=Adat`. Kategori yang tersedia: `Kekerabatan`, `Adat`, `Kepercayaan`, `Kehidupan Sehari-hari`, `Seni dan Upacara`, `Bahasa dan Pepatah`.

**Response 200:**
```json
{
  "data": [
    {
      "kontenId": "literasi-01",
      "judul": "Marga dan Silsilah",
      "kategori": "Kekerabatan",
      "urutan": 1,
      "gambarUrl": null,
      "selesai": true
    },
    {
      "kontenId": "literasi-02",
      "judul": "Hula-hula dan Boru",
      "kategori": "Kekerabatan",
      "urutan": 2,
      "gambarUrl": null,
      "selesai": false
    }
  ]
}
```

`gambarUrl` bernilai `null` bila konten belum punya gambar. Frontend cukup menampilkan teks dalam kasus ini.

---

## GET /api/literasi-budaya/:id

Detail konten Literasi Budaya berupa teks dan gambar (FR-16, UC-16). Paragraf pada `isi` dipisahkan oleh baris kosong (`\n\n`). `sumber` berisi rujukan pustaka untuk ditampilkan sebagai atribusi.

**Auth:** wajib

**Response 200:**
```json
{
  "data": {
    "kontenId": "literasi-03",
    "judul": "Ulos dan Piso",
    "kategori": "Adat",
    "urutan": 3,
    "isi": "Dalam hubungan antarkerabat, pemberian dari hula-hula kepada boru disebut ulos, ...",
    "gambarUrl": null,
    "sumber": "J. C. Vergouwen, The Social Organisation and Customary Law of the Toba-Batak of Northern Sumatra (The Hague: Martinus Nijhoff, 1964), hlm. 58-61."
  }
}
```

**Response 404:** konten tidak ditemukan (UC-16 alur A1).
```json
{ "error": "NotFound", "message": "Konten Literasi Budaya tidak ditemukan." }
```

---

## POST /api/literasi-budaya/:id/selesai

Tandai satu konten Literasi Budaya sebagai selesai dibaca. Level budaya pengguna dihitung ulang dari jumlah konten yang selesai: 0 sampai 2 konten `Pemula`, 3 sampai 5 `Menengah`, 6 atau lebih `Mahir`. Menandai konten yang sama berulang kali tidak menambah hitungan (`baru: false`).

**Auth:** wajib

**Request:** tanpa body

**Response 200:**
```json
{
  "data": {
    "kontenId": "literasi-03",
    "baru": true,
    "jumlahSelesai": 3,
    "levelBudaya": "Menengah"
  }
}
```

**Response 404:** konten tidak ditemukan, atau profil pengguna belum dibuat.

---

## POST /api/chatbot

Kirim pertanyaan ke Chatbot. Bila layanan NLP gagal atau melewati batas waktu, jawaban fallback statis dikembalikan dengan status 200 dan `sumber: "fallback"`.

**Auth:** wajib

**Request:**
```json
{ "pesan": "Apa arti horas?", "konteks": "Materi Salam dan Sapaan" }
```

`pesan` wajib, maksimal 1000 karakter. `konteks` opsional, maksimal 1000 karakter.

**Response 200:**
```json
{
  "data": {
    "pesanId": "abc123",
    "pertanyaan": "Apa arti horas?",
    "jawaban": "...",
    "sumber": "nlp",
    "tersimpan": true,
    "waktu": "2026-11-15T12:00:00.000Z"
  }
}
```

**Response 400:** `pesan` kosong, terlalu panjang, atau `konteks` tidak valid.

---

## GET /api/chatbot/riwayat

Riwayat percakapan milik pengguna, urut dari yang paling lama.

**Auth:** wajib

**Query:** `limit` opsional, bilangan bulat 1 sampai 50 (bawaan 20).

**Response 200:**
```json
{
  "data": [
    {
      "pesanId": "abc123",
      "pertanyaan": "Apa arti horas?",
      "jawaban": "...",
      "sumber": "nlp",
      "waktu": "2026-11-15T12:00:00.000Z"
    }
  ]
}
```

---

## GET /api/forum

Daftar topik Forum Diskusi, terbaru lebih dulu. `penulis` bernilai `null` jika akun penulis sudah dihapus.

**Auth:** wajib

**Query:** `limit` opsional (bawaan 20, maksimal 50), `cursor` opsional (`topikId` terakhir dari halaman sebelumnya).

**Response 200:**
```json
{
  "data": {
    "topik": [
      {
        "topikId": "abc123",
        "uid": "uid-penulis",
        "judul": "Arti kata horas",
        "isi": "Apa arti horas dalam percakapan sehari-hari?",
        "waktu": "2026-11-16T03:00:00.000Z",
        "penulis": { "uid": "uid-penulis", "username": "desi", "nama": "Desi", "fotoProfil": null },
        "jumlahBalasan": 2
      }
    ],
    "nextCursor": "abc123"
  }
}
```

`nextCursor` bernilai `null` jika tidak ada halaman berikutnya.

**Response 400:** `cursor` tidak valid.

---

## POST /api/forum

Buat topik baru (UC-11).

**Auth:** wajib

**Request:**
```json
{ "judul": "Arti kata horas", "isi": "Apa arti horas dalam percakapan sehari-hari?" }
```

**Response 201:** objek topik seperti pada GET /api/forum, dengan `jumlahBalasan` bernilai 0.

**Response 400:** `judul` atau `isi` kosong, atau melebihi batas (judul 150 karakter, isi 5000 karakter).

---

## GET /api/forum/:topikId

Detail topik beserta balasannya, urut dari yang terlama (maksimal 200 balasan).

**Auth:** wajib

**Response 200:** objek topik seperti pada GET /api/forum, ditambah field `balasan`:
```json
{
  "data": {
    "topikId": "abc123",
    "uid": "uid-penulis",
    "judul": "Arti kata horas",
    "isi": "Apa arti horas dalam percakapan sehari-hari?",
    "waktu": "2026-11-16T03:00:00.000Z",
    "penulis": { "uid": "uid-penulis", "username": "desi", "nama": "Desi", "fotoProfil": null },
    "jumlahBalasan": 1,
    "balasan": [
      {
        "balasanId": "bal123",
        "uid": "uid-pembalas",
        "isi": "Horas artinya salam, bisa untuk halo atau selamat.",
        "waktu": "2026-11-16T03:05:00.000Z",
        "penulis": { "uid": "uid-pembalas", "username": "ani", "nama": "Ani", "fotoProfil": null }
      }
    ]
  }
}
```

**Response 404:** topik tidak ditemukan.

---

## POST /api/forum/:topikId/balasan

Balas sebuah topik (UC-12).

**Auth:** wajib

**Request:**
```json
{ "isi": "Horas artinya salam, bisa untuk halo atau selamat." }
```

**Response 201:**
```json
{
  "data": {
    "balasanId": "bal123",
    "uid": "uid-pembalas",
    "isi": "Horas artinya salam, bisa untuk halo atau selamat.",
    "waktu": "2026-11-16T03:05:00.000Z",
    "penulis": { "uid": "uid-pembalas", "username": "ani", "nama": "Ani", "fotoProfil": null }
  }
}
```

**Response 400:** `isi` kosong atau lebih dari 2000 karakter.

**Response 404:** topik tidak ditemukan.