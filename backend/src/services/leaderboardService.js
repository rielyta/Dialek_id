const { db } = require("../config/firebaseAdmin");

const KOLEKSI_LEADERBOARD = "Leaderboard";

// Peringkat memakai aturan kompetisi: skor sama berbagi peringkat yang sama (1, 2, 2, 4).
function berikanPeringkat(daftarDoc) {
  const hasil = [];
  daftarDoc.forEach((doc, i) => {
    const d = doc.data();
    const skor = Number(d.skorTertinggi) || 0;
    const peringkat = i > 0 && skor === hasil[i - 1].skorTertinggi ? hasil[i - 1].peringkat : i + 1;
    hasil.push({
      peringkat,
      uid: d.uid ?? doc.id,
      nama: d.nama ?? null,
      skorTertinggi: skor,
    });
  });
  return hasil;
}

async function ambilTop(limit) {
  const snap = await db
    .collection(KOLEKSI_LEADERBOARD)
    .orderBy("skorTertinggi", "desc")
    .limit(limit)
    .get();
  return berikanPeringkat(snap.docs);
}

// Peringkat satu pemain. Mengembalikan null bila pemain belum punya skor di Leaderboard.
async function ambilPeringkatPemain(uid) {
  const doc = await db.collection(KOLEKSI_LEADERBOARD).doc(uid).get();
  if (!doc.exists) return null;

  const d = doc.data();
  const skor = Number(d.skorTertinggi) || 0;
  const lebihTinggi = await db
    .collection(KOLEKSI_LEADERBOARD)
    .where("skorTertinggi", ">", skor)
    .count()
    .get();

  return {
    peringkat: lebihTinggi.data().count + 1,
    uid,
    nama: d.nama ?? null,
    skorTertinggi: skor,
  };
}

module.exports = { ambilTop, ambilPeringkatPemain };