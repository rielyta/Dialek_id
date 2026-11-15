const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");
const {
  normalisasiKata,
  hurufTerakhir,
  kataAda,
  cariKataDenganAwalan,
  pilihKataAwal,
} = require("../services/permainanService");

const SKOR_PER_KATA = 10;
const MAKS_PANJANG_KATA = 50;

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function serverError(res, fungsi, err) {
  console.error(`[permainanController.${fungsi}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

function keIso(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().toISOString() : null;
}

function refSesi(sesiId) {
  return db.collection("Permainan").doc(sesiId);
}

function formatSesi(sesiId, data) {
  return {
    sesiId,
    status: data.status,
    skor: data.skor,
    jumlahKata: data.kataTerpakai.length,
    kataTerpakai: data.kataTerpakai,
    kataTerakhir: data.kataTerakhir,
    hurufBerikutnya: hurufTerakhir(data.kataTerakhir),
    alasanSelesai: data.alasanSelesai ?? null,
    waktuMulai: keIso(data.waktuMulai),
    waktuSelesai: keIso(data.waktuSelesai),
  };
}

function periksaSesi(snap, uid) {
  if (!snap.exists) {
    return { galat: { kode: 404, error: "NotFound", message: "Sesi permainan tidak ditemukan." } };
  }
  const data = snap.data();
  if (data.uid !== uid) {
    return { galat: { kode: 403, error: "Forbidden", message: "Sesi ini bukan milik Anda." } };
  }
  if (data.status !== "berjalan") {
    return { galat: { kode: 409, error: "Conflict", message: "Sesi permainan sudah berakhir." } };
  }
  return { data };
}

function kirimGalat(res, galat) {
  return res.status(galat.kode).json({ error: galat.error, message: galat.message });
}

async function ambilNama(uid) {
  const doc = await db.collection("Users").doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return data.nama ?? data.username ?? null;
}

async function siapkanLeaderboard(tx, uid, skor) {
  const ref = db.collection("Leaderboard").doc(uid);
  const snap = await tx.get(ref);
  const skorLama = snap.exists ? snap.data().skorTertinggi ?? 0 : 0;
  if (skor <= skorLama) return null;
  const nama = await ambilNama(uid);
  return () => tx.set(ref, { uid, nama, skorTertinggi: skor, diperbarui: Timestamp.now() }, { merge: true });
}

async function akhiriDalamTransaksi(tx, ref, data, uid, alasan, tambahan = {}) {
  const sesiAkhir = {
    ...data,
    ...tambahan,
    status: "selesai",
    alasanSelesai: alasan,
    waktuSelesai: Timestamp.now(),
  };
  const tulisLeaderboard = await siapkanLeaderboard(tx, uid, sesiAkhir.skor);
  tx.update(ref, { ...tambahan, status: sesiAkhir.status, alasanSelesai: alasan, waktuSelesai: sesiAkhir.waktuSelesai });
  if (tulisLeaderboard) tulisLeaderboard();
  return { sesiAkhir, rekorBaru: tulisLeaderboard !== null };
}

async function mulaiPermainan(req, res) {
  try {
    const uid = req.user.uid;
    const kataAwal = await pilihKataAwal();
    if (!kataAwal) {
      return serverError(res, "mulaiPermainan", new Error("Data kosakata belum tersedia untuk memulai permainan."));
    }

    const ref = db.collection("Permainan").doc();
    const data = {
      uid,
      status: "berjalan",
      skor: 0,
      kataTerpakai: [kataAwal],
      kataTerakhir: kataAwal,
      waktuMulai: Timestamp.now(),
    };
    await ref.set(data);

    return res.status(201).json({ data: { ...formatSesi(ref.id, data), kataAwal } });
  } catch (err) {
    return serverError(res, "mulaiPermainan", err);
  }
}

async function kirimJawaban(req, res) {
  try {
    const uid = req.user.uid;
    const { sesiId } = req.params;
    const kataMentah = req.body?.kata;

    if (typeof kataMentah !== "string" || kataMentah.trim() === "") {
      return badRequest(res, "Field 'kata' wajib berupa teks dan tidak boleh kosong.");
    }
    const kata = normalisasiKata(kataMentah);
    if (kata.length > MAKS_PANJANG_KATA) {
      return badRequest(res, `Field 'kata' maksimal ${MAKS_PANJANG_KATA} karakter.`);
    }

    const ref = refSesi(sesiId);
    let hasil = null;
    let galat = null;

    await db.runTransaction(async (tx) => {
      hasil = null;
      galat = null;
      const snap = await tx.get(ref);
      const periksa = periksaSesi(snap, uid);
      if (periksa.galat) {
        galat = periksa.galat;
        return;
      }
      const data = periksa.data;

      let alasan = null;
      if (kata[0] !== hurufTerakhir(data.kataTerakhir)) alasan = "tidak_sesuai_aturan_sambung";
      else if (data.kataTerpakai.includes(kata)) alasan = "sudah_dipakai";
      else if (!(await kataAda(kata))) alasan = "tidak_ada_di_kosakata";

      if (alasan) {
        const { sesiAkhir, rekorBaru } = await akhiriDalamTransaksi(tx, ref, data, uid, alasan);
        hasil = { valid: false, alasan, kataSistem: null, rekorBaru, sesi: formatSesi(sesiId, sesiAkhir) };
        return;
      }

      const terpakai = [...data.kataTerpakai, kata];
      const skor = data.skor + SKOR_PER_KATA;
      const kataSistem = await cariKataDenganAwalan(hurufTerakhir(kata), terpakai);

      if (!kataSistem) {
        const tambahan = { kataTerpakai: terpakai, kataTerakhir: kata, skor };
        const { sesiAkhir, rekorBaru } = await akhiriDalamTransaksi(tx, ref, data, uid, "sistem_kehabisan_kata", tambahan);
        hasil = { valid: true, alasan: null, kataSistem: null, rekorBaru, sesi: formatSesi(sesiId, sesiAkhir) };
        return;
      }

      const perubahan = { kataTerpakai: [...terpakai, kataSistem], kataTerakhir: kataSistem, skor };
      tx.update(ref, perubahan);
      hasil = { valid: true, alasan: null, kataSistem, rekorBaru: false, sesi: formatSesi(sesiId, { ...data, ...perubahan }) };
    });

    if (galat) return kirimGalat(res, galat);
    return res.status(200).json({ data: hasil });
  } catch (err) {
    return serverError(res, "kirimJawaban", err);
  }
}

async function akhiriPermainan(req, res) {
  try {
    const uid = req.user.uid;
    const { sesiId } = req.params;
    const ref = refSesi(sesiId);
    let hasil = null;
    let galat = null;

    await db.runTransaction(async (tx) => {
      hasil = null;
      galat = null;
      const snap = await tx.get(ref);
      const periksa = periksaSesi(snap, uid);
      if (periksa.galat) {
        galat = periksa.galat;
        return;
      }

      const { sesiAkhir, rekorBaru } = await akhiriDalamTransaksi(tx, ref, periksa.data, uid, "dihentikan_pemain");
      hasil = { rekorBaru, sesi: formatSesi(sesiId, sesiAkhir) };
    });

    if (galat) return kirimGalat(res, galat);
    return res.status(200).json({ data: hasil });
  } catch (err) {
    return serverError(res, "akhiriPermainan", err);
  }
}

module.exports = { mulaiPermainan, kirimJawaban, akhiriPermainan };