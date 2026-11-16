const { db } = require("../config/firebaseAdmin");

const KOLEKSI_KOSAKATA = "Kosakata";
const FIELD_KATA = "kataBatak";

const JUMLAH_KANDIDAT = 50;
const PERCOBAAN_KATA_AWAL = 8;

function normalisasiKata(kata) {
  return String(kata).toLowerCase().trim().replace(/\s+/g, " ");
}

function hurufTerakhir(kata) {
  return kata.slice(-1);
}

function acak(daftar) {
  return daftar[Math.floor(Math.random() * daftar.length)];
}

async function kataAda(kata) {
  const snap = await db.collection(KOLEKSI_KOSAKATA).where(FIELD_KATA, "==", kata).limit(1).get();
  return !snap.empty;
}

async function cariKataDenganAwalan(huruf, terpakai) {
  const snap = await db
    .collection(KOLEKSI_KOSAKATA)
    .where(FIELD_KATA, ">=", huruf)
    .where(FIELD_KATA, "<", huruf + "\uf8ff")
    .limit(JUMLAH_KANDIDAT)
    .get();

  const kandidat = snap.docs
    .map((doc) => normalisasiKata(doc.get(FIELD_KATA) ?? ""))
    .filter((kata) => kata !== "" && !terpakai.includes(kata));

  return kandidat.length > 0 ? acak(kandidat) : null;
}

async function pilihKataAwal() {
  for (let i = 0; i < PERCOBAAN_KATA_AWAL; i++) {
    const titik = db.collection(KOLEKSI_KOSAKATA).doc().id;
    let snap = await db
      .collection(KOLEKSI_KOSAKATA)
      .orderBy("__name__")
      .startAt(titik)
      .limit(1)
      .get();
    if (snap.empty) {
      snap = await db.collection(KOLEKSI_KOSAKATA).orderBy("__name__").limit(1).get();
    }
    if (snap.empty) return null;

    const kata = normalisasiKata(snap.docs[0].get(FIELD_KATA) ?? "");
    if (kata.length < 2) continue;

    const lanjutan = await cariKataDenganAwalan(hurufTerakhir(kata), [kata]);
    if (lanjutan) return kata;
  }
  return null;
}

module.exports = {
  normalisasiKata,
  hurufTerakhir,
  kataAda,
  cariKataDenganAwalan,
  pilihKataAwal,
};