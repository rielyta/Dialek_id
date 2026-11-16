const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");

const MAKS_JUDUL = 150;
const MAKS_ISI = 5000;
const MAKS_BALASAN = 2000;
const LIMIT_DEFAULT = 20;
const LIMIT_MAKS = 50;
const MAKS_BALASAN_DIBACA = 200;

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function notFound(res, message) {
  return res.status(404).json({ error: "NotFound", message });
}

function serverError(res, fungsi, err) {
  console.error(`[forumController.${fungsi}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

function teksValid(nilai, maks) {
  return typeof nilai === "string" && nilai.trim() !== "" && nilai.trim().length <= maks;
}

function keIso(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().toISOString() : null;
}

// Ambil profil singkat penulis dari koleksi Users. Penulis yang akunnya sudah dihapus bernilai null.
async function ambilPenulis(daftarUid) {
  const uidUnik = [...new Set(daftarUid)];
  const hasil = {};
  if (uidUnik.length === 0) return hasil;

  const refs = uidUnik.map((uid) => db.collection("Users").doc(uid));
  const docs = await db.getAll(...refs);

  docs.forEach((doc, i) => {
    if (doc.exists) {
      const data = doc.data();
      hasil[uidUnik[i]] = {
        uid: uidUnik[i],
        username: data.username ?? null,
        nama: data.nama ?? null,
        fotoProfil: data.fotoProfil ?? null,
      };
    } else {
      hasil[uidUnik[i]] = null;
    }
  });
  return hasil;
}

function formatTopik(doc, penulisMap, jumlahBalasan) {
  const data = doc.data();
  return {
    topikId: doc.id,
    uid: data.uid,
    judul: data.judul,
    isi: data.isi,
    waktu: keIso(data.waktu),
    penulis: penulisMap[data.uid] ?? null,
    jumlahBalasan,
  };
}

function formatBalasan(doc, penulisMap) {
  const data = doc.data();
  return {
    balasanId: doc.id,
    uid: data.uid,
    isi: data.isi,
    waktu: keIso(data.waktu),
    penulis: penulisMap[data.uid] ?? null,
  };
}

async function getDaftarTopik(req, res) {
  try {
    let limit = Number.parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = LIMIT_DEFAULT;
    if (limit > LIMIT_MAKS) limit = LIMIT_MAKS;

    let query = db.collection("Forum").orderBy("waktu", "desc").limit(limit);

    if (req.query.cursor) {
      const cursorDoc = await db.collection("Forum").doc(String(req.query.cursor)).get();
      if (!cursorDoc.exists) {
        return badRequest(res, "Cursor tidak valid.");
      }
      query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const penulisMap = await ambilPenulis(snapshot.docs.map((doc) => doc.data().uid));
    const hitung = await Promise.all(
      snapshot.docs.map((doc) => doc.ref.collection("Balasan").count().get())
    );

    const topik = snapshot.docs.map((doc, i) => formatTopik(doc, penulisMap, hitung[i].data().count));
    const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.size - 1].id : null;

    return res.status(200).json({ data: { topik, nextCursor } });
  } catch (err) {
    return serverError(res, "getDaftarTopik", err);
  }
}

async function buatTopik(req, res) {
  try {
    const uid = req.user.uid;
    const { judul, isi } = req.body || {};

    if (!teksValid(judul, MAKS_JUDUL)) {
      return badRequest(res, `Judul wajib diisi dan maksimal ${MAKS_JUDUL} karakter.`);
    }
    if (!teksValid(isi, MAKS_ISI)) {
      return badRequest(res, `Isi wajib diisi dan maksimal ${MAKS_ISI} karakter.`);
    }

    const ref = db.collection("Forum").doc();
    const waktu = Timestamp.now();
    await ref.set({ uid, judul: judul.trim(), isi: isi.trim(), waktu });

    const penulisMap = await ambilPenulis([uid]);
    const doc = await ref.get();

    return res.status(201).json({ data: formatTopik(doc, penulisMap, 0) });
  } catch (err) {
    return serverError(res, "buatTopik", err);
  }
}

async function getDetailTopik(req, res) {
  try {
    const topikDoc = await db.collection("Forum").doc(req.params.topikId).get();
    if (!topikDoc.exists) {
      return notFound(res, "Topik tidak ditemukan.");
    }

    const balasanSnapshot = await topikDoc.ref
      .collection("Balasan")
      .orderBy("waktu", "asc")
      .limit(MAKS_BALASAN_DIBACA)
      .get();

    const semuaUid = [topikDoc.data().uid, ...balasanSnapshot.docs.map((doc) => doc.data().uid)];
    const penulisMap = await ambilPenulis(semuaUid);

    const topik = formatTopik(topikDoc, penulisMap, balasanSnapshot.size);
    const balasan = balasanSnapshot.docs.map((doc) => formatBalasan(doc, penulisMap));

    return res.status(200).json({ data: { ...topik, balasan } });
  } catch (err) {
    return serverError(res, "getDetailTopik", err);
  }
}

async function balasTopik(req, res) {
  try {
    const uid = req.user.uid;
    const { isi } = req.body || {};

    if (!teksValid(isi, MAKS_BALASAN)) {
      return badRequest(res, `Balasan wajib diisi dan maksimal ${MAKS_BALASAN} karakter.`);
    }

    const topikRef = db.collection("Forum").doc(req.params.topikId);
    const topikDoc = await topikRef.get();
    if (!topikDoc.exists) {
      return notFound(res, "Topik tidak ditemukan.");
    }

    const ref = topikRef.collection("Balasan").doc();
    await ref.set({ uid, isi: isi.trim(), waktu: Timestamp.now() });

    const penulisMap = await ambilPenulis([uid]);
    const doc = await ref.get();

    return res.status(201).json({ data: formatBalasan(doc, penulisMap) });
  } catch (err) {
    return serverError(res, "balasTopik", err);
  }
}

module.exports = { getDaftarTopik, buatTopik, getDetailTopik, balasTopik };