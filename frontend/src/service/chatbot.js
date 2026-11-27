import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class GalatChatbot extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function ambilToken() {
  await auth.authStateReady();
  const pengguna = auth.currentUser;
  if (!pengguna) {
    throw new GalatChatbot(401, "Sesi login berakhir. Silakan masuk lagi.");
  }
  return pengguna.getIdToken();
}

/**
 * Mengirim pertanyaan pengguna beserta riwayat percakapan singkat ke backend AI Chatbot.
 * POST /api/chatbot
 * Body: { pesan: string, riwayat: Array<{ peran: "user" | "bot", teks: string }> }
 */
export async function kirimPesanChatbot(pesan, riwayat = []) {
  const token = await ambilToken();

  let respons;
  try {
    respons = await fetch(`${API_BASE_URL}/api/chatbot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pesan,
        riwayat: riwayat.slice(-10),
      }),
    });
  } catch {
    throw new GalatChatbot(
      0,
      "Tidak dapat terhubung ke server. Periksa koneksi internetmu."
    );
  }

  let json = null;
  try {
    json = await respons.json();
  } catch {
    json = null;
  }

  if (!respons.ok) {
    if (respons.status === 503) {
      throw new GalatChatbot(
        503,
        "Layanan asisten AI sedang sibuk. Silakan coba beberapa saat lagi."
      );
    }
    throw new GalatChatbot(
      respons.status,
      json?.message || "Gagal mendapatkan jawaban dari chatbot."
    );
  }

  const data = json?.data ?? json;
  const balasan =
    typeof data === "string"
      ? data
      : data?.balasan ||
        data?.jawaban ||
        data?.reply ||
        data?.response ||
        data?.message;

  if (!balasan) {
    throw new GalatChatbot(500, "Respons chatbot kosong.");
  }

  return balasan;
}