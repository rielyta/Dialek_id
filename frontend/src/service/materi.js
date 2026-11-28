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

export function ambilDaftarMateri(topik = "") {
  let url = "/api/materi";
  if (topik) url += `?topik=${encodeURIComponent(topik)}`;
  return panggil(url);
}

export function ambilDetailMateri(id) {
  return panggil(`/api/materi/${encodeURIComponent(id)}`);
}

export function kirimRating(id, nilai) {
  return panggil(`/api/materi/${encodeURIComponent(id)}/rating`, {
    method: "POST",
    body: { nilai },
  });
}

export function jawabLatihan(id, jawaban) {
  return panggil(`/api/materi/${encodeURIComponent(id)}/latihan/jawaban`, {
    method: "POST",
    body: { jawaban },
  });
}
