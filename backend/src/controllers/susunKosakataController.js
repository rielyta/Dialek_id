const { db } = require("../config/firebaseAdmin");
const { AMBANG_BATAS, nilaiJawaban } = require("../services/fuzzyMatchEngine");

function acakHuruf(kata) {
  const huruf = kata.split("");
  if (new Set(huruf).size < 2) return huruf;

  let hasil;
  do {
    hasil = [...huruf];
    for (let i = hasil.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
    }
  } while (hasil.join("") === kata);
  return hasil;
}

async function getSoal(req, res) {
  try {
    const dasar = db.collection("Kosakata").where("layakKuis", "==", true);

    const hitung = await dasar.count().get();
    const total = hitung.data().count;
    if (total === 0) {
      return res.status(404).json({ error: "NotFound", message: "Data kosakata belum tersedia." });
    }

    const nomor = Math.floor(Math.random() * total);
    let snap = await db.collection("Kosakata").where("nomorKuis", "==", nomor).limit(1).get();
    if (snap.empty) snap = await dasar.limit(1).get();

    const doc = snap.docs[0];
    const d = doc.data();

    return res.status(200).json({
      data: {
        kosakataId: doc.id,
        kataIndonesia: d.kataIndonesia,
        kategori: d.kategori || null,
        jumlahHuruf: d.kataBatak.length,
        hurufAcak: acakHuruf(d.kataBatak),
      },
    });
  } catch (err) {
    console.error("[susunKosakataController.getSoal]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

async function jawabSoal(req, res) {
  try {
    const uid = req.user.uid;
    const { kosakataId, jawaban } = req.body;

    if (typeof kosakataId !== "string" || kosakataId.trim() === "") {
      return res.status(400).json({ error: "BadRequest", message: "Field kosakataId wajib diisi." });
    }
    if (typeof jawaban !== "string" || jawaban.trim() === "") {
      return res.status(400).json({ error: "BadRequest", message: "Field jawaban wajib diisi." });
    }

    const doc = await db.collection("Kosakata").doc(kosakataId.trim()).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "NotFound", message: "Kosakata tidak ditemukan." });
    }
    const kataBenar = doc.data().kataBatak;

    let penilaian;
    try {
      penilaian = nilaiJawaban(jawaban, kataBenar);
    } catch (errMesin) {
      console.error("[susunKosakataController.jawabSoal] Fuzzy Match Engine gagal:", errMesin);
      return res.status(503).json({
        error: "ServiceUnavailable",
        message: "Fuzzy Match Engine tidak merespons. Jawaban tidak dinilai.",
      });
    }

    let tersimpan = true;
    try {
      const ref = db.collection("HasilSusunKosakata").doc();
      await ref.set({
        hasilId: ref.id,
        uid,
        kosakataId: doc.id,
        skor: penilaian.skor,
        diperbaruiPada: new Date().toISOString(),
      });
    } catch (errSimpan) {
      console.error("[susunKosakataController.jawabSoal] gagal menyimpan hasil:", errSimpan);
      tersimpan = false;
    }

    return res.status(200).json({
      data: {
        kosakataId: doc.id,
        skor: penilaian.skor,
        benar: penilaian.benar,
        ambangBatas: AMBANG_BATAS,
        kataBenar,
        tersimpan,
      },
    });
  } catch (err) {
    console.error("[susunKosakataController.jawabSoal]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

async function getRingkasan(req, res) {
  try {
    const uid = req.user.uid;
    const snap = await db.collection("HasilSusunKosakata").where("uid", "==", uid).get();

    let totalSkor = 0;
    let skorTertinggi = 0;
    let jumlahBenar = 0;

    snap.forEach((doc) => {
      const skor = Number(doc.data().skor) || 0;
      totalSkor += skor;
      if (skor > skorTertinggi) skorTertinggi = skor;
      if (skor >= AMBANG_BATAS) jumlahBenar += 1;
    });

    const jumlahJawaban = snap.size;

    return res.status(200).json({
      data: {
        jumlahJawaban,
        jumlahBenar,
        skorRataRata: jumlahJawaban > 0 ? Math.round((totalSkor / jumlahJawaban) * 10) / 10 : 0,
        skorTertinggi,
        ambangBatas: AMBANG_BATAS,
      },
    });
  } catch (err) {
    console.error("[susunKosakataController.getRingkasan]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

module.exports = { getSoal, jawabSoal, getRingkasan };