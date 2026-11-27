import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

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

async function panggil(path, { method = "GET", body } = {}) {
  const token = await ambilToken();

  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let respons;
  try {
    respons = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

// GET /api/akun -> { uid, username, nama, email, provider, levelBudaya, expPoin, tanggalDaftar }
export function ambilAkun() {
  return panggil("/api/akun");
}

// GET /api/dashboard -> { levelBudaya, exp, kosakataMingguan, progresLatihan, peringkatSambungKata }
// Dipakai untuk kotak peringkat, level, dan pencapaian di halaman profil.
export function ambilRingkasanBelajar() {
  return panggil("/api/dashboard");
}

// PUT /api/akun. Hanya field yang dikirim yang diubah: { nama, username, email, password }.
export function ubahAkun(data) {
  return panggil("/api/akun", { method: "PUT", body: data });
}

// DELETE /api/akun
export function hapusAkun() {
  return panggil("/api/akun", { method: "DELETE" });
}

function pesanGalatFirebase(err) {
  switch (err?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Kata sandi salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Periksa jaringanmu.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Jendela konfirmasi ditutup sebelum selesai.";
    default:
      return err?.message || "Konfirmasi identitas gagal.";
  }
}

export async function konfirmasiIdentitas({ provider, email, kataSandi }) {
  await auth.authStateReady();
  const pengguna = auth.currentUser;
  if (!pengguna) throw new GalatApi(401, "Sesi login berakhir. Silakan masuk lagi.");

  try {
    if (provider === "google") {
      await reauthenticateWithPopup(pengguna, googleProvider);
    } else {
      const surel = pengguna.email || email;
      const kredensial = EmailAuthProvider.credential(surel, kataSandi);
      await reauthenticateWithCredential(pengguna, kredensial);
    }
    // Ambil token baru supaya waktu login terbarunya (auth_time) ikut diperbarui.
    await pengguna.getIdToken(true);
  } catch (err) {
    throw new GalatApi(401, pesanGalatFirebase(err));
  }
}

export async function segarkanSesi() {
  try {
    await auth.currentUser.getIdToken(true);
    await auth.currentUser.reload();
    return true;
  } catch {
    return false;
  }
}

export async function keluar() {
  await signOut(auth);
}
