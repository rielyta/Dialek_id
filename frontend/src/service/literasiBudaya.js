import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class GalatApi extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function ambilToken() {
  await auth.authStateReady();
  const pengguna = auth.currentUser;
  if (!pengguna) {
    throw new GalatApi(401, "Sesi login berakhir. Silakan masuk lagi.");
  }
  return pengguna.getIdToken();
}

async function panggil(path, { method = "GET" } = {}) {
  const token = await ambilToken();

  let respons;
  try {
    respons = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
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

// GET /api/literasi-budaya -> [{ kontenId, judul, kategori, urutan, gambarUrl, selesai }]
export function ambilDaftarLiterasi() {
  return panggil("/api/literasi-budaya");
}

// GET /api/literasi-budaya/:id -> { kontenId, judul, kategori, urutan, isi, gambarUrl, sumber }
export function ambilDetailLiterasi(kontenId) {
  return panggil(`/api/literasi-budaya/${encodeURIComponent(kontenId)}`);
}

// POST /api/literasi-budaya/:id/selesai -> { kontenId, baru, jumlahSelesai, levelBudaya }
export function tandaiSelesai(kontenId) {
  return panggil(`/api/literasi-budaya/${encodeURIComponent(kontenId)}/selesai`, { method: "POST" });
}

export async function ambilUsername() {
  try {
    const data = await panggil("/api/akun");
    return data?.username || data?.nama || null;
  } catch {
    return null;
  }
}
