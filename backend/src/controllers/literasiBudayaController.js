const { db } = require("../config/firebaseAdmin");

const KOLEKSI_LITERASI = "LiterasiBudaya";

const TINGKAT_BUDAYA = [
  { nama: "Pemula", minSelesai: 0 },
  { nama: "Menengah", minSelesai: 3 },
  { nama: "Mahir", minSelesai: 6 },
];

function hitungLevelBudaya(jumlahSelesai) {
  let level = TINGKAT_BUDAYA[0].nama;
  TINGKAT_BUDAYA.forEach((t) => {
    if (jumlahSelesai >= t.minSelesai) level = t.nama;
  });
  return level;
}

function serverError(res, fungsi, err) {
  console.error(`[literasiBudayaController.${fungsi}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

async function getDaftarLiterasi(req, res) {
  try {
    const { kategori } = req.query;

    let query = db.collection(KOLEKSI_LITERASI);
    if (typeof kategori === "string" && kategori.trim() !== "") {
      query = query.where("kategori", "==", kategori.trim());
    }

    const [snap, userDoc] = await Promise.all([
      query.get(),
      db.collection("Users").doc(req.user.uid).get(),
    ]);

    const selesai = new Set(userDoc.exists ? userDoc.data().literasiSelesai || [] : []);

    const data = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          kontenId: doc.id,
          judul: d.judul,
          kategori: d.kategori,
          urutan: d.urutan ?? 0,
          gambarUrl: d.gambarUrl ?? null,
          selesai: selesai.has(doc.id),
        };
      })
      .sort((a, b) => a.urutan - b.urutan);

    return res.status(200).json({ data });
  } catch (err) {
    return serverError(res, "getDaftarLiterasi", err);
  }
}

async function getDetailLiterasi(req, res) {
  try {
    const doc = await db.collection(KOLEKSI_LITERASI).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "NotFound", message: "Konten Literasi Budaya tidak ditemukan." });
    }

    const d = doc.data();
    return res.status(200).json({
      data: {
        kontenId: doc.id,
        judul: d.judul,
        kategori: d.kategori,
        urutan: d.urutan ?? 0,
        isi: d.isi,
        gambarUrl: d.gambarUrl ?? null,
        sumber: d.sumber ?? null,
      },
    });
  } catch (err) {
    return serverError(res, "getDetailLiterasi", err);
  }
}

async function tandaiSelesai(req, res) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const kontenRef = db.collection(KOLEKSI_LITERASI).doc(id);
    const userRef = db.collection("Users").doc(uid);

    const hasil = await db.runTransaction(async (t) => {
      const [kontenDoc, userDoc] = await t.getAll(kontenRef, userRef);
      if (!kontenDoc.exists) return { galat: 404, pesan: "Konten Literasi Budaya tidak ditemukan." };
      if (!userDoc.exists) return { galat: 404, pesan: "Profil pengguna belum dibuat." };

      const lama = userDoc.data().literasiSelesai || [];
      const baru = !lama.includes(id);
      const daftar = baru ? [...lama, id] : lama;
      const levelBudaya = hitungLevelBudaya(daftar.length);

      if (baru) t.update(userRef, { literasiSelesai: daftar, levelBudaya });

      return { kontenId: id, baru, jumlahSelesai: daftar.length, levelBudaya };
    });

    if (hasil.galat) {
      return res.status(hasil.galat).json({ error: "NotFound", message: hasil.pesan });
    }

    return res.status(200).json({ data: hasil });
  } catch (err) {
    return serverError(res, "tandaiSelesai", err);
  }
}

module.exports = { getDaftarLiterasi, getDetailLiterasi, tandaiSelesai };