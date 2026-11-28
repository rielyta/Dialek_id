const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");
const {
  normalisasiKata,
  hurufTerakhir,
  kataAda,
  cariKataDenganAwalan,
  pilihKataAwal,
} = require("../services/permainanService");
const { tanggalHariIni, refSkorPemain } = require("../services/leaderboardService");

const SKOR_PER_KATA = 10;
const MAKS_PANJANG_KATA = 50;

// Satu sesi berlangsung 60 detik sejak waktuMulai. Toleransi menutup keterlambatan jaringan,
// supaya jawaban yang dikirim tepat sebelum waktu habis tidak ditolak.
const DURASI_SESI_DETIK = 60;
const TOLERANSI_JARINGAN_DETIK = 3;

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

// Kata pada kataTerpakai selalu bergantian: indeks 0 kata awal dari sistem, indeks ganjil dari pemain,
// indeks genap berikutnya dari sistem. Skor sistem = jumlah kata sambungan sistem (tanpa kata awal) x skor per kata.
function hitungSkorSistem(kataTerpakai) {
  const kataSistem = kataTerpakai.filter((_, i) => i % 2 === 0).length;
  return Math.max(0, kataSistem - 1) * SKOR_PER_KATA;
}

function formatSesi(sesiId, data) {
  return {
    sesiId,
    status: data.status,
    skor: data.skor,
    skorSistem: hitungSkorSistem(data.kataTerpakai),
    durasiDetik: DURASI_SESI_DETIK,
    jumlahKata: data.kataTerpakai.length,
    kataTerpakai: data.kataTerpakai,
    kataTerakhir: data.kataTerakhir,
    hurufBerikutnya: hurufTerakhir(data.kataTerakhir),
    alasanSelesai: data.alasanSelesai ?? null,
    waktuMulai: keIso(data.waktuMulai),
    waktuSelesai: keIso(data.waktuSelesai),
  };
}

function melewatiBatasWaktu(data) {
  const mulai = data.waktuMulai && typeof data.waktuMulai.toMillis === "function" ? data.waktuMulai.toMillis() : null;
  if (mulai === null) return false;
  return Date.now() > mulai + (DURASI_SESI_DETIK + TOLERANSI_JARINGAN_DETIK) * 1000;
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

// Memperbarui dua leaderboard sekaligus: skor tertinggi hari ini (Leaderboard harian) dan
// skor tertinggi sepanjang waktu (Leaderboard, dipakai Dashboard). Semua pembacaan dilakukan
// lebih dulu; penulisan dijalankan lewat fungsi `tulis` setelah pembacaan lain selesai.
async function siapkanLeaderboard(tx, uid, skor) {
  const tanggal = tanggalHariIni();
  const refSemua = refSkorPemain("semua", uid);
  const refHarian = refSkorPemain("harian", uid, tanggal);

  const snapSemua = await tx.get(refSemua);
  const snapHarian = await tx.get(refHarian);
  const skorLamaSemua = snapSemua.exists ? snapSemua.data().skorTertinggi ?? 0 : 0;
  const skorLamaHarian = snapHarian.exists ? snapHarian.data().skorTertinggi ?? 0 : 0;

  const rekorSemua = skor > skorLamaSemua;
  const rekorHarian = skor > skorLamaHarian;
  if (!rekorSemua && !rekorHarian) return null;

  const nama = await ambilNama(uid);
  const tulis = () => {
    if (rekorSemua) {
      tx.set(refSemua, { uid, nama, skorTertinggi: skor, diperbarui: Timestamp.now() }, { merge: true });
    }
    if (rekorHarian) {
      tx.set(refHarian, { uid, nama, tanggal, skorTertinggi: skor, diperbarui: Timestamp.now() }, { merge: true });
    }
  };
  // rekorBaru mengikuti skor tertinggi hari ini, sesuai peringkat yang ditampilkan di layar permainan.
  return { tulis, rekorBaru: rekorHarian };
}

async function akhiriDalamTransaksi(tx, ref, data, uid, alasan, tambahan = {}) {
  const sesiAkhir = {
    ...data,
    ...tambahan,
    status: "selesai",
    alasanSelesai: alasan,
    waktuSelesai: Timestamp.now(),
  };
  const leaderboard = await siapkanLeaderboard(tx, uid, sesiAkhir.skor);
  tx.update(ref, { ...tambahan, status: sesiAkhir.status, alasanSelesai: alasan, waktuSelesai: sesiAkhir.waktuSelesai });
  if (leaderboard) leaderboard.tulis();
  return { sesiAkhir, rekorBaru: leaderboard ? leaderboard.rekorBaru : false };
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

      // Jawaban yang tiba setelah batas waktu tidak dihitung; sesi diakhiri dengan skor yang sudah ada.
      if (melewatiBatasWaktu(data)) {
        const { sesiAkhir, rekorBaru } = await akhiriDalamTransaksi(tx, ref, data, uid, "waktu_habis");
        hasil = { valid: false, alasan: "waktu_habis", kataSistem: null, rekorBaru, sesi: formatSesi(sesiId, sesiAkhir) };
        return;
      }

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