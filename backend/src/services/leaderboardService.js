const { db } = require("../config/firebaseAdmin");

// Leaderboard semua waktu: Leaderboard/{uid}. Dipakai juga oleh Dashboard.
const KOLEKSI_SEMUA = "Leaderboard";
// Leaderboard harian: LeaderboardHarian/{yyyy-mm-dd}/Skor/{uid}. Satu dokumen per pemain per hari.
const KOLEKSI_HARIAN = "LeaderboardHarian";
const SUBKOLEKSI_HARIAN = "Skor";

// Pergantian hari mengikuti waktu Indonesia Barat.
const ZONA_WAKTU = "Asia/Jakarta";

const PERIODE_VALID = ["harian", "semua"];

// Rentang skor untuk grafik distribusi performa. Batas atas rentang terakhir terbuka.
const BATAS_BAWAH_DISTRIBUSI = [1, 50, 100, 150, 200];

// Mengubah waktu (milidetik) menjadi tanggal "yyyy-mm-dd" menurut ZONA_WAKTU.
function tanggalHariIni(sekarangMs = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_WAKTU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(sekarangMs));
}

function koleksiPeriode(periode, tanggal) {
  if (periode === "harian") {
    return db.collection(KOLEKSI_HARIAN).doc(tanggal).collection(SUBKOLEKSI_HARIAN);
  }
  return db.collection(KOLEKSI_SEMUA);
}

// Dokumen skor satu pemain pada periode tertentu (dipakai controller permainan di dalam transaksi).
function refSkorPemain(periode, uid, tanggal = tanggalHariIni()) {
  return koleksiPeriode(periode, tanggal).doc(uid);
}

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

async function ambilTop(limit, periode = "semua", tanggal = tanggalHariIni()) {
  const snap = await koleksiPeriode(periode, tanggal)
    .orderBy("skorTertinggi", "desc")
    .limit(limit)
    .get();
  return berikanPeringkat(snap.docs);
}

// Peringkat satu pemain. Mengembalikan null bila pemain belum punya skor pada periode itu.
async function ambilPeringkatPemain(uid, periode = "semua", tanggal = tanggalHariIni()) {
  const koleksi = koleksiPeriode(periode, tanggal);
  const doc = await koleksi.doc(uid).get();
  if (!doc.exists) return null;

  const d = doc.data();
  const skor = Number(d.skorTertinggi) || 0;
  const lebihTinggi = await koleksi.where("skorTertinggi", ">", skor).count().get();

  return {
    peringkat: lebihTinggi.data().count + 1,
    uid,
    nama: d.nama ?? null,
    skorTertinggi: skor,
  };
}

// Jumlah pemain pada tiap rentang skor tertinggi, untuk grafik distribusi performa.
async function ambilDistribusi(periode = "semua", tanggal = tanggalHariIni()) {
  const koleksi = koleksiPeriode(periode, tanggal);

  return Promise.all(
    BATAS_BAWAH_DISTRIBUSI.map(async (bawah, i) => {
      const berikutnya = BATAS_BAWAH_DISTRIBUSI[i + 1];
      let kueri = koleksi.where("skorTertinggi", ">=", bawah);
      if (berikutnya !== undefined) kueri = kueri.where("skorTertinggi", "<", berikutnya);
      const hitung = await kueri.count().get();

      return {
        label: berikutnya !== undefined ? `${bawah}-${berikutnya - 1}` : `${bawah}+`,
        batasBawah: bawah,
        batasAtas: berikutnya !== undefined ? berikutnya - 1 : null,
        jumlah: hitung.data().count,
      };
    })
  );
}

module.exports = {
  PERIODE_VALID,
  tanggalHariIni,
  refSkorPemain,
  ambilTop,
  ambilPeringkatPemain,
  ambilDistribusi,
};