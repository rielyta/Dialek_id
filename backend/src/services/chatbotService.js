const {
  INSTRUKSI_SISTEM,
  ATURAN_BATASAN,
  CONTOH_JAWABAN,
  TEMPERATURE,
  MAKS_TOKEN_JAWABAN,
} = require("./chatbotPrompt");

const NLP_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const NLP_URL = `https://generativelanguage.googleapis.com/v1beta/models/${NLP_MODEL}:generateContent`;
const BATAS_WAKTU_MS = Number(process.env.CHATBOT_BATAS_WAKTU_MS) || 2000;

function getFallbackResponse() {
  return "Maaf, Chatbot sedang tidak dapat merespons. Silakan coba beberapa saat lagi.";
}

function susunPermintaan(pertanyaan, konteks, riwayat) {
  let instruksi = `${INSTRUKSI_SISTEM} ${ATURAN_BATASAN}`;
  if (konteks) {
    instruksi += ` Konteks dari halaman yang sedang dibuka pengguna: ${konteks}`;
  }
  const isi = [];
  for (const item of [...CONTOH_JAWABAN, ...riwayat]) {
    isi.push({ role: "user", parts: [{ text: item.pertanyaan }] });
    isi.push({ role: "model", parts: [{ text: item.jawaban }] });
  }
  isi.push({ role: "user", parts: [{ text: pertanyaan }] });
  return { instruksi, isi };
}

async function kirimKeNLP(pertanyaan, konteks = "", riwayat = []) {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) {
    console.error("[chatbotService] GEMINI_API_KEY belum diisi, memakai fallback");
    return { jawaban: getFallbackResponse(), sumber: "fallback" };
  }

  try {
    const { instruksi, isi } = susunPermintaan(pertanyaan, konteks, riwayat);
    const res = await fetch(NLP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": kunci,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instruksi }] },
        contents: isi,
        generationConfig: { maxOutputTokens: MAKS_TOKEN_JAWABAN, temperature: TEMPERATURE },
      }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });

    if (!res.ok) {
      console.error(`[chatbotService] NLP membalas status ${res.status}`);
      return { jawaban: getFallbackResponse(), sumber: "fallback" };
    }

    const data = await res.json();
    const bagian = data?.candidates?.[0]?.content?.parts;
    const jawaban = Array.isArray(bagian) ? bagian.map((b) => b.text || "").join("") : "";
    if (jawaban.trim() === "") {
      console.error("[chatbotService] NLP membalas tanpa isi jawaban:", data?.candidates?.[0]?.finishReason);
      return { jawaban: getFallbackResponse(), sumber: "fallback" };
    }
    return { jawaban: jawaban.trim(), sumber: "nlp" };
  } catch (err) {
    console.error("[chatbotService] NLP gagal atau melewati batas waktu:", err.name, err.message);
    return { jawaban: getFallbackResponse(), sumber: "fallback" };
  }
}

module.exports = { kirimKeNLP, getFallbackResponse, susunPermintaan };