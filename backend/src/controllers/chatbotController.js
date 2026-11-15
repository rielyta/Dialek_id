const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");
const { kirimKeNLP } = require("../services/chatbotService");

const MAKS_PESAN = 1000;
const MAKS_KONTEKS = 1000;
const JUMLAH_RIWAYAT_KONTEKS = 5;
const LIMIT_DEFAULT = 20;
const LIMIT_MAKS = 50;

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function serverError(res, fungsi, err) {
  console.error(`[chatbotController.${fungsi}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

function keIso(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().toISOString() : null;
}

// Riwayat disimpan di Chatbot/{uid}/Pesan/{pesanId}.
function koleksiPesan(uid) {
  return db.collection("Chatbot").doc(uid).collection("Pesan");
}

function formatPesan(doc) {
  const data = doc.data();
  return {
    pesanId: doc.id,
    pertanyaan: data.pertanyaan,
    jawaban: data.jawaban,
    sumber: data.sumber,
    waktu: keIso(data.waktu),
  };
}

// POST /api/chatbot
async function kirimPesan(req, res) {
  try {
    const uid = req.user.uid;
    const { pesan, konteks } = req.body || {};

    if (typeof pesan !== "string" || pesan.trim() === "") {
      return badRequest(res, "Pertanyaan tidak boleh kosong.");
    }
    if (pesan.trim().length > MAKS_PESAN) {
      return badRequest(res, `Pertanyaan maksimal ${MAKS_PESAN} karakter.`);
    }
    if (konteks !== undefined && (typeof konteks !== "string" || konteks.length > MAKS_KONTEKS)) {
      return badRequest(res, `Konteks harus berupa teks maksimal ${MAKS_KONTEKS} karakter.`);
    }

    const pertanyaan = pesan.trim();

    // Riwayat terakhir sebagai konteks percakapan. Jawaban fallback tidak ikut dikirim ke NLP.
    let riwayat = [];
    try {
      const snap = await koleksiPesan(uid).orderBy("waktu", "desc").limit(JUMLAH_RIWAYAT_KONTEKS).get();
      riwayat = snap.docs
        .map((d) => d.data())
        .filter((d) => d.sumber === "nlp")
        .reverse();
    } catch (err) {
      console.error("[chatbotController.kirimPesan] gagal membaca riwayat:", err.message);
    }

    const { jawaban, sumber } = await kirimKeNLP(pertanyaan, konteks || "", riwayat);

    const waktu = Timestamp.now();
    let pesanId = null;
    let tersimpan = false;
    try {
      const ref = await koleksiPesan(uid).add({ uid, pertanyaan, jawaban, sumber, waktu });
      pesanId = ref.id;
      tersimpan = true;
    } catch (err) {
      console.error("[chatbotController.kirimPesan] gagal menyimpan riwayat:", err.message);
    }

    return res.status(200).json({
      data: { pesanId, pertanyaan, jawaban, sumber, tersimpan, waktu: keIso(waktu) },
    });
  } catch (err) {
    return serverError(res, "kirimPesan", err);
  }
}

// GET /api/chatbot/riwayat?limit=20
async function getRiwayat(req, res) {
  try {
    const uid = req.user.uid;

    let limit = LIMIT_DEFAULT;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT_MAKS) {
        return badRequest(res, `limit harus bilangan bulat 1 sampai ${LIMIT_MAKS}.`);
      }
    }

    const snap = await koleksiPesan(uid).orderBy("waktu", "desc").limit(limit).get();
    // Dibalik agar urut dari yang paling lama, siap ditampilkan di widget chat.
    const data = snap.docs.map(formatPesan).reverse();
    return res.status(200).json({ data });
  } catch (err) {
    return serverError(res, "getRiwayat", err);
  }
}

module.exports = { kirimPesan, getRiwayat };