const { db } = require("../config/firebaseAdmin");

const TINGKAT_LEVEL = [
  { nama: "Pemula", minExp: 0 },
  { nama: "Menengah", minExp: 100 },
  { nama: "Mahir", minExp: 300 },
];
const HARI_MINGGUAN = 7;

function hitungBarExp(expPoin) {
  let indeks = 0;
  TINGKAT_LEVEL.forEach((t, i) => {
    if (expPoin >= t.minExp) indeks = i;
  });
  const sekarang = TINGKAT_LEVEL[indeks];
  const berikut = TINGKAT_LEVEL[indeks + 1] || null;

  if (!berikut) {
    return { expPoin, levelSaatIni: sekarang.nama, expLevelBerikutnya: null, persenExp: 100 };
  }

  const rentang = berikut.minExp - sekarang.minExp;
  const persen = Math.round(((expPoin - sekarang.minExp) / rentang) * 100);
  return {
    expPoin,
    levelSaatIni: sekarang.nama,
    expLevelBerikutnya: berikut.minExp,
    persenExp: persen,
  };
}

async function hitungProgresLatihan(uid) {
  const materiSnap = await db.collection("Materi").get();

  const daftar = await Promise.all(
    materiSnap.docs.map(async (m) => {
      const [latihanSnap, hasilSnap] = await Promise.all([
        m.ref.collection("Latihan").get(),
        m.ref.collection("HasilLatihan").where("uid", "==", uid).get(),
      ]);

      const jumlahSoal = latihanSnap.size;
      const jumlahDikerjakan = hasilSnap.size;
      let totalSkor = 0;
      hasilSnap.forEach((h) => {
        totalSkor += Number(h.data().skor) || 0;
      });

      return {
        materiId: m.id,
        judul: m.data().judul,
        urutan: m.data().urutan ?? 0,
        jumlahSoal,
        jumlahDikerjakan,
        skor: jumlahDikerjakan > 0 ? Math.round(totalSkor / jumlahDikerjakan) : 0,
        selesai: jumlahSoal > 0 && jumlahDikerjakan >= jumlahSoal,
      };
    })
  );

  return daftar.sort((a, b) => a.urutan - b.urutan).map(({ urutan, ...sisa }) => sisa);
}

async function hitungKosakataMingguan(uid) {
  const snap = await db.collection("HasilSusunKosakata").where("uid", "==", uid).get();

  const batas = Date.now() - HARI_MINGGUAN * 24 * 60 * 60 * 1000;
  let jumlah = 0;
  let totalSkor = 0;

  snap.forEach((doc) => {
    const d = doc.data();
    const waktu = d.diperbaruiPada ? Date.parse(d.diperbaruiPada) : NaN;
    if (!Number.isNaN(waktu) && waktu >= batas) {
      jumlah += 1;
      totalSkor += Number(d.skor) || 0;
    }
  });

  return {
    jumlahKataMingguIni: jumlah,
    skorRataRata: jumlah > 0 ? Math.round((totalSkor / jumlah) * 10) / 10 : 0,
  };
}

async function getDashboard(req, res) {
  try {
    const uid = req.user.uid;

    const [userDoc, progresLatihan, kosakataMingguan] = await Promise.all([
      db.collection("Users").doc(uid).get(),
      hitungProgresLatihan(uid),
      hitungKosakataMingguan(uid),
    ]);

    const user = userDoc.exists ? userDoc.data() : {};
    const expPoin = Number(user.expPoin) || 0;
    const bar = hitungBarExp(expPoin);

    return res.status(200).json({
      data: {
        levelBudaya: user.levelBudaya || TINGKAT_LEVEL[0].nama,
        exp: bar,
        kosakataMingguan,
        progresLatihan,
        peringkatSambungKata: null,
      },
    });
  } catch (err) {
    console.error("[dashboardController.getDashboard]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

module.exports = { getDashboard };