const { db } = require("../config/firebaseAdmin");

async function getDaftarMateri(req, res) {
  try {
    const { topik } = req.query;

    let query = db.collection("Materi");
    if (topik) query = query.where("kategori", "==", topik);

    const snap = await query.get();

    const data = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          materiId: doc.id,
          judul: d.judul,
          kategori: d.kategori,
          urutan: d.urutan ?? 0,
          ratingRataRata: d.ratingRataRata ?? 0,
        };
      })
      .sort((a, b) => a.urutan - b.urutan);

    return res.status(200).json({ data });
  } catch (err) {
    console.error("[materiController.getDaftarMateri]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

async function getDetailMateri(req, res) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const materiRef = db.collection("Materi").doc(id);
    const [materiDoc, latihanSnap, ratingDoc] = await Promise.all([
      materiRef.get(),
      materiRef.collection("Latihan").get(),
      materiRef.collection("Rating").doc(uid).get(),
    ]);

    if (!materiDoc.exists) {
      return res.status(404).json({ error: "NotFound", message: "Materi tidak ditemukan." });
    }

    const d = materiDoc.data();

    const latihan = latihanSnap.docs
      .map((l) => ({
        latihanId: l.id,
        pertanyaan: l.data().pertanyaan,
        urutan: l.data().urutan ?? 0,
      }))
      .sort((a, b) => a.urutan - b.urutan);

    return res.status(200).json({
      data: {
        materiId: materiDoc.id,
        judul: d.judul,
        kategori: d.kategori,
        isi: d.isi,
        urutan: d.urutan ?? 0,
        ratingRataRata: d.ratingRataRata ?? 0,
        jumlahRating: d.jumlahRating ?? 0,
        ratingSaya: ratingDoc.exists ? ratingDoc.data().nilai : null,
        latihan,
      },
    });
  } catch (err) {
    console.error("[materiController.getDetailMateri]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

async function kirimRating(req, res) {
  try {
    const { id } = req.params;
    const { nilai } = req.body;
    const uid = req.user.uid;

    if (!Number.isInteger(nilai) || nilai < 1 || nilai > 5) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Field nilai harus bilangan bulat 1 sampai 5.",
      });
    }

    const materiRef = db.collection("Materi").doc(id);
    const ratingRef = materiRef.collection("Rating").doc(uid);

    const materiAda = await materiRef.get();
    if (!materiAda.exists) {
      return res.status(404).json({ error: "NotFound", message: "Materi tidak ditemukan." });
    }

    const sudahLatihan = await materiRef
      .collection("HasilLatihan")
      .where("uid", "==", uid)
      .limit(1)
      .get();
    if (sudahLatihan.empty) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Selesaikan latihan materi ini terlebih dahulu sebelum memberi rating.",
      });
    }

    const hasil = await db.runTransaction(async (t) => {
      const [materiDoc, ratingDoc] = await t.getAll(materiRef, ratingRef);
      if (!materiDoc.exists) return null;

      const m = materiDoc.data();
      let total = m.totalRating || 0;
      let jumlah = m.jumlahRating || 0;

      if (ratingDoc.exists) {
        total += nilai - ratingDoc.data().nilai;
      } else {
        total += nilai;
        jumlah += 1;
      }

      const rataRata = Math.round((total / jumlah) * 10) / 10;

      t.set(
        ratingRef,
        { ratingId: uid, uid, materiId: id, nilai, diperbaruiPada: new Date().toISOString() },
        { merge: true }
      );
      t.update(materiRef, { totalRating: total, jumlahRating: jumlah, ratingRataRata: rataRata });

      return { materiId: id, nilai, ratingRataRata: rataRata, jumlahRating: jumlah };
    });

    if (!hasil) {
      return res.status(404).json({ error: "NotFound", message: "Materi tidak ditemukan." });
    }

    return res.status(200).json({ data: hasil });
  } catch (err) {
    console.error("[materiController.kirimRating]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

function normalisasi(teks) {
  return String(teks).toLowerCase().trim().replace(/\s+/g, " ");
}

async function jawabLatihan(req, res) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { jawaban } = req.body;

    if (!Array.isArray(jawaban) || jawaban.length === 0) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Field jawaban harus berupa array dan tidak boleh kosong.",
      });
    }

    const materiRef = db.collection("Materi").doc(id);
    const [materiDoc, latihanSnap] = await Promise.all([
      materiRef.get(),
      materiRef.collection("Latihan").get(),
    ]);

    if (!materiDoc.exists) {
      return res.status(404).json({ error: "NotFound", message: "Materi tidak ditemukan." });
    }

    const daftarSoal = latihanSnap.docs
      .map((l) => ({ latihanId: l.id, ...l.data() }))
      .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
    const idSoal = new Set(daftarSoal.map((s) => s.latihanId));

    const jawabanPerSoal = new Map();
    for (const j of jawaban) {
      if (!j || typeof j.latihanId !== "string" || typeof j.jawaban !== "string") {
        return res.status(400).json({
          error: "BadRequest",
          message: "Setiap jawaban harus berisi latihanId dan jawaban berupa teks.",
        });
      }
      if (!idSoal.has(j.latihanId)) {
        return res.status(400).json({
          error: "BadRequest",
          message: `latihanId ${j.latihanId} tidak ada pada materi ini.`,
        });
      }
      jawabanPerSoal.set(j.latihanId, j.jawaban);
    }

    const belumDijawab = daftarSoal
      .filter((s) => {
        const j = jawabanPerSoal.get(s.latihanId);
        return j === undefined || normalisasi(j) === "";
      })
      .map((s) => s.latihanId);

    if (belumDijawab.length > 0) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Ada soal yang belum dijawab. Lengkapi semua jawaban sebelum mengirim.",
        belumDijawab,
      });
    }

    const waktu = new Date().toISOString();
    const batch = db.batch();
    let jumlahBenar = 0;

    const hasil = daftarSoal.map((s) => {
      const diisi = jawabanPerSoal.get(s.latihanId);
      const kunci = [s.kunciJawaban, ...(s.kunciAlternatif || [])].map(normalisasi);
      const benar = kunci.includes(normalisasi(diisi));
      if (benar) jumlahBenar += 1;

      const hasilId = `${uid}_${s.latihanId}`;
      batch.set(materiRef.collection("HasilLatihan").doc(hasilId), {
        hasilId,
        uid,
        materiId: id,
        latihanId: s.latihanId,
        skor: benar ? 100 : 0,
        diperbaruiPada: waktu,
      });

      return {
        latihanId: s.latihanId,
        pertanyaan: s.pertanyaan,
        jawabanKamu: diisi,
        benar,
        kunciJawaban: s.kunciJawaban,
        pembahasan: s.pembahasan || null,
      };
    });

    let tersimpan = true;
    try {
      await batch.commit();
    } catch (errSimpan) {
      console.error("[materiController.jawabLatihan] gagal menyimpan hasil:", errSimpan);
      tersimpan = false;
    }

    const jumlahSoal = daftarSoal.length;
    const skor = jumlahSoal > 0 ? Math.round((jumlahBenar / jumlahSoal) * 100) : 0;

    return res.status(200).json({
      data: {
        materiId: id,
        jumlahSoal,
        jumlahBenar,
        skor,
        tersimpan,
        peringatan: tersimpan ? null : "Hasil latihan gagal disimpan, tetapi skor tetap ditampilkan.",
        hasil,
      },
    });
  } catch (err) {
    console.error("[materiController.jawabLatihan]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

module.exports = { getDaftarMateri, getDetailMateri, kirimRating, jawabLatihan };