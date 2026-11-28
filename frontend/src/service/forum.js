import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function ambilToken() {
  await auth.authStateReady();
  const pengguna = auth.currentUser;
  if (!pengguna) {
    throw new Error("Sesi login berakhir. Silakan masuk lagi.");
  }
  return pengguna.getIdToken();
}

async function panggil(path, { method = "GET", body } = {}) {
  const token = await ambilToken();

  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const respons = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await respons.json().catch(() => ({}));

  if (!respons.ok) {
    const err = new Error(json.message || "Terjadi kesalahan pada server.");
    err.status = respons.status;
    throw err;
  }
  return json.data;
}

// GET /api/forum?limit=20&cursor=...
// -> { topik: [...], nextCursor }
export function ambilDaftarTopik(limit = 20, cursor = null) {
  let url = `/api/forum?limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  return panggil(url);
}

// POST /api/forum  body: { judul, isi }
// -> topik object
export function buatTopik(judul, isi) {
  return panggil("/api/forum", { method: "POST", body: { judul, isi } });
}

// GET /api/forum/:topikId
// -> { ...topik, balasan: [...] }
export function ambilDetailTopik(topikId) {
  return panggil(`/api/forum/${encodeURIComponent(topikId)}`);
}

// POST /api/forum/:topikId/balasan  body: { isi }
// -> balasan object
export function balasTopik(topikId, isi) {
  return panggil(`/api/forum/${encodeURIComponent(topikId)}/balasan`, {
    method: "POST",
    body: { isi },
  });
}
