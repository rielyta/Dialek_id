import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class GalatApi extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function ambilToken() {
  // Tunggu Firebase selesai memulihkan sesi (penting saat halaman di-refresh).
  await auth.authStateReady();
  const pengguna = auth.currentUser;
  if (!pengguna) {
    throw new GalatApi(401, "Sesi login berakhir. Silakan masuk lagi.");
  }
  return pengguna.getIdToken();
}

async function panggil(path, { method = "GET", body } = {}) {
  const token = await ambilToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let respons;
  try {
    respons = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new GalatApi(0, "Tidak dapat terhubung ke server. Periksa koneksi internetmu.");
  }

  let json = null;
  try {
    json = await respons.json();
  } catch {
    json = null;
  }

  if (!respons.ok) {
    throw new GalatApi(respons.status, json?.message || "Terjadi kesalahan pada server.");
  }
  return json.data;
}

// GET /api/susun-kosakata/soal -> { kosakataId, kataIndonesia, kategori, jumlahHuruf, hurufAcak[] }
export function ambilSoal() {
  return panggil("/api/susun-kosakata/soal");
}

// POST /api/susun-kosakata/jawab -> { kosakataId, skor, benar, ambangBatas, kataBenar, tersimpan }
export function kirimJawaban(kosakataId, jawaban) {
  return panggil("/api/susun-kosakata/jawab", { method: "POST", body: { kosakataId, jawaban } });
}

// Username untuk pojok kanan atas. Mengembalikan null bila gagal; tampilan memakai nama cadangan.
export async function ambilUsername() {
  try {
    const data = await panggil("/api/akun");
    return data?.username || data?.nama || null;
  } catch {
    return null;
  }
}
