require("dotenv").config();
const { db } = require("../src/config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

const daftarMateri = [
  {
    id: "materi-01",
    judul: "Kata Ganti Subjek",
    kategori: "Tata Bahasa",
    urutan: 1,
    isi:
      "Kata ganti subjek dalam bahasa Batak Toba:\n\n" +
      "1. Ahu (Au) = aku. Ditulis ahu, di beberapa daerah dibaca au.\n" +
      "2. Ho = kamu. Dipakai untuk teman atau orang sederajat. Kurang halus untuk orang yang lebih tua atau disegani secara adat.\n" +
      "3. Ibana (Imana) = dia, untuk laki-laki maupun perempuan. Bersifat informal, kurang cocok untuk orang yang dihormati.\n" +
      "4. Nasida (Halak i) = mereka. Juga dipakai sebagai bentuk halus dari 'dia' untuk orang yang lebih tua atau disegani.\n" +
      "5. Hami = kami.\n" +
      "6. Hamu = kalian. Juga bentuk sopan dari 'kamu' untuk orang yang lebih tua atau lebih tinggi derajat adatnya.\n" +
      "7. On = ini. Kata penunjuk benda, sepadan dengan 'it' dalam bahasa Inggris.",
    latihan: [
      { id: "latihan-01", urutan: 1, pertanyaan: "Apa bahasa Batak Toba untuk 'aku'?", kunciJawaban: "ahu", kunciAlternatif: ["au"], pembahasan: "Ahu berarti 'aku'. Di beberapa daerah dibaca au." },
      { id: "latihan-02", urutan: 2, pertanyaan: "Apa bahasa Batak Toba untuk 'kamu' (kepada teman sebaya)?", kunciJawaban: "ho", kunciAlternatif: [], pembahasan: "Ho berarti 'kamu', dipakai kepada teman atau orang sederajat." },
      { id: "latihan-03", urutan: 3, pertanyaan: "Apa bahasa Batak Toba untuk 'dia' (informal)?", kunciJawaban: "ibana", kunciAlternatif: ["imana"], pembahasan: "Ibana (imana) berarti 'dia' dalam bentuk informal." },
      { id: "latihan-04", urutan: 4, pertanyaan: "Apa bahasa Batak Toba untuk 'mereka'?", kunciJawaban: "nasida", kunciAlternatif: ["halak i"], pembahasan: "Nasida (halak i) berarti 'mereka', dan juga bentuk halus dari 'dia' untuk orang yang disegani." },
      { id: "latihan-05", urutan: 5, pertanyaan: "Apa bahasa Batak Toba untuk 'kami'?", kunciJawaban: "hami", kunciAlternatif: [], pembahasan: "Hami berarti 'kami'." },
      { id: "latihan-06", urutan: 6, pertanyaan: "Apa bahasa Batak Toba untuk 'kamu' (bentuk sopan kepada orang yang lebih tua)?", kunciJawaban: "hamu", kunciAlternatif: [], pembahasan: "Hamu adalah bentuk sopan dari 'kamu' untuk orang yang lebih tua atau dihormati." },
      { id: "latihan-07", urutan: 7, pertanyaan: "Apa bahasa Batak Toba untuk 'ini' (penunjuk benda)?", kunciJawaban: "on", kunciAlternatif: [], pembahasan: "On berarti 'ini', kata penunjuk benda." },
    ],
  },
];

const idDihapus = ["materi-02"];

async function main() {
  for (const id of idDihapus) {
    await db.recursiveDelete(db.collection("Materi").doc(id));
    console.log("Dihapus (jika ada):", id);
  }

  for (const m of daftarMateri) {
    const { id, latihan, ...data } = m;
    const ref = db.collection("Materi").doc(id);
    await ref.set({ materiId: id, ...data }, { merge: true });
    await ref.update({ sumber: FieldValue.delete() });
    for (const l of latihan) {
      const { id: lid, ...ldata } = l;
      await ref.collection("Latihan").doc(lid).set({ latihanId: lid, materiId: id, ...ldata }, { merge: true });
    }
    console.log("OK:", id, "-", m.judul);
  }
  console.log("Selesai.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});