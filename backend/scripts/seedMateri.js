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
  {
    id: "materi-02",
    judul: "Subjek, Objek, dan Kepunyaan",
    kategori: "Tata Bahasa",
    urutan: 2,
    isi:
      "Pola dasar urutan kata adalah subjek, objek, lalu kepemilikan:\n\n" +
      "1. Aku: subjek/objek ahu/au; kepemilikan -hu (contoh: hepengku) atau aekku/hakku (milikku).\n" +
      "2. Kamu: subjek/objek ho; kepemilikan -mu (contoh: hepengmu) atau ammu/hamu (milikmu).\n" +
      "3. Dia: subjek/objek ibana/imana; kepemilikan -na (contoh: hepengna) atau anna (miliknya).\n" +
      "4. Kalian: subjek/objek hamu (juga bentuk halus 'kamu' untuk orang yang dihormati); kepemilikan -mu/-muna.\n" +
      "5. Kami: subjek/objek hami; kepemilikan -nami (contoh: jabunami); milik kami: hannami/ahnami.\n" +
      "6. Mereka: subjek/objek nasida/hasida/halak i; kepemilikan diawali ni (ni nasida/ni hasida/ni halak i).\n" +
      "7. Kata benda: on (dekat/terjangkau) dan i (lebih jauh/tidak tampak); kepemilikan memakai ni on / ni i.",
    latihan: [
      { id: "latihan-01", urutan: 1, pertanyaan: "Apa bentuk kepemilikan 'duitku / uangku' dalam bahasa Batak Toba?", kunciJawaban: "hepengku", kunciAlternatif: ["hp-ku"], pembahasan: "Akhiran kepemilikan untuk 'aku' adalah -hu, sehingga uangku menjadi hepengku." },
      { id: "latihan-02", urutan: 2, pertanyaan: "Bagaimana menyatakan kepemilikan 'rumah kami'?", kunciJawaban: "jabunami", kunciAlternatif: [], pembahasan: "Kata ganti kepemilikan untuk 'kami' adalah -nami, digabung dengan jabu (rumah) menjadi jabunami." },
      { id: "latihan-03", urutan: 3, pertanyaan: "Apa awalan kepemilikan untuk 'mereka' (misalnya pada 'ni nasida')?", kunciJawaban: "ni", kunciAlternatif: [], pembahasan: "Bentuk kepemilikan untuk 'mereka' diawali kata 'ni' sebelum nasida, hasida, atau halak i." },
    ],
  },
  {
    id: "materi-03",
    judul: "Kata Tanya dan Kalimat Tanya",
    kategori: "Kosakata & Kalimat",
    urutan: 3,
    isi:
      "Kata tanya utama dalam bahasa Batak Toba:\n\n" +
      "1. Apa = aha (contoh: aha on? = ini apa?)\n" +
      "2. Mengapa = boasa (contoh: boasa tangis ho? = mengapa kamu menangis?)\n" +
      "3. Siapa = ise (contoh: ise goarmu? = siapa namamu?)\n" +
      "4. Di mana = di dia (contoh: di dia jabum? = di mana rumahmu?)\n" +
      "5. Kapan = andigan (masa depan) atau nangkin/nadigan (masa lampau)\n" +
      "6. Bagaimana = songon dia (contoh: songon dia carana? = bagaimana caranya?)\n" +
      "7. Tambahan sehari-hari: boha (kenapa / masa sih / kurang jelas), alani aha (karena apa), tu dia (ke mana).",
    latihan: [
      { id: "latihan-01", urutan: 1, pertanyaan: "Apa bahasa Batak Toba untuk kata tanya 'apa'?", kunciJawaban: "aha", kunciAlternatif: [], pembahasan: "Aha berarti 'apa', misalnya 'aha on?' (ini apa?)." },
      { id: "latihan-02", urutan: 2, pertanyaan: "Apa kata tanya 'kapan' untuk menyatakan waktu di masa depan?", kunciJawaban: "andigan", kunciAlternatif: [], pembahasan: "Andigan digunakan untuk menanyakan kapan di masa depan, sedangkan nangkin/nadigan untuk masa lalu." },
      { id: "latihan-03", urutan: 3, pertanyaan: "Apa bahasa Batak Toba untuk 'di mana'?", kunciJawaban: "di dia", kunciAlternatif: ["didia"], pembahasan: "Di dia berarti 'di mana', contohnya 'di dia jabum?' (di mana rumahmu?)." },
    ],
  },
  {
    id: "materi-04",
    judul: "Cara Membaca dan Aturan Penulisan",
    kategori: "Ejaan & Pelafalan",
    urutan: 4,
    isi:
      "Penulisan formal bahasa Batak Toba (surat, buku adat/pelajaran, lirik lagu, Alkitab) sering berbeda dengan pelafalan sehari-hari:\n\n" +
      "- ng + k dibaca kk (contoh: angka dibaca akka)\n" +
      "- n + k dibaca kk\n" +
      "- m + p dibaca pp (contoh: mangopa dibaca mangoppa)\n" +
      "- m + b di beberapa daerah dibaca bb (contoh: lambok dibaca labbok)\n" +
      "- n + d di beberapa daerah dibaca dd (contoh: hundul dibaca huddul)\n" +
      "- n + s dibaca ss dan n + j dibaca jj\n" +
      "- t + h / mangihuthon menjadi bunyi tt, dan p + h / maradophon menjadi bunyi pp.",
    latihan: [
      { id: "latihan-01", urutan: 1, pertanyaan: "Bagaimana pelafalan umum kata 'angka' menurut aturan baca Batak Toba?", kunciJawaban: "akka", kunciAlternatif: [], pembahasan: "Kombinasi ng + k umumnya dibaca sebagai bunyi rangkap kk (akka)." },
      { id: "latihan-02", urutan: 2, pertanyaan: "Apa arti 'mangopa' dalam bahasa Batak Toba?", kunciJawaban: "menggendong", kunciAlternatif: [], pembahasan: "Mangopa berarti 'menggendong' (dengan pelafalan m + p menjadi pp)." },
    ],
  },
  {
    id: "materi-05",
    judul: "Angka, Bilangan Bertingkat, dan Satuan",
    kategori: "Bilangan & Satuan",
    urutan: 5,
    isi:
      "1. Satuan 1-10: sada (1), dua (2), tolu (3), opat (4), lima (5), onom (6), pitu (7), walu (8), sia (9), sampulu (10).\n" +
      "2. Belasan & puluhan: 11 dan 12 juga disebut sabolas dan duabolas (sering untuk jam); belasan 13-19 memakai sampulu + satuan; puluhan memakai pul di tengah.\n" +
      "3. Bilangan bertingkat: diawali pa- dan diakhiri -hon (kecuali pertama = parjolo; contoh: paduahon = kedua, patoluhon = ketiga). Tambahan na- berarti 'yang ke-'.\n" +
      "4. Satuan/penggolong: umumnya memakai sa- ('se-'), seperti sahalak (seorang), saekor (seekor), sapiring (sepiring), sagelas (segelas).",
    latihan: [
      { id: "latihan-01", urutan: 1, pertanyaan: "Apa bahasa Batak Toba untuk angka 'satu'?", kunciJawaban: "sada", kunciAlternatif: [], pembahasan: "Angka 1 dalam bahasa Batak Toba adalah sada." },
      { id: "latihan-02", urutan: 2, pertanyaan: "Apa bahasa Batak Toba untuk bilangan bertingkat 'kedua'?", kunciJawaban: "paduahon", kunciAlternatif: [], pembahasan: "Bilangan bertingkat memakai pola pa- ... -hon, sehingga kedua menjadi paduahon." },
      { id: "latihan-03", urutan: 3, pertanyaan: "Apa bahasa Batak Toba untuk 'seorang'?", kunciJawaban: "sahalak", kunciAlternatif: [], pembahasan: "Halak berarti orang, dan awalan sa- ('se-') membentuk kata sahalak (seorang)." },
    ],
  },
];

const idDihapus = [];

async function main() {
  for (const id of idDihapus) {
    await db.recursiveDelete(db.collection("Materi").doc(id));
    console.log("Dihapus (jika ada):", id);
  }

  for (const m of daftarMateri) {
    const { id, latihan, ...data } = m;
    const ref = db.collection("Materi").doc(id);
    await ref.set({ materiId: id, ...data, sumber: FieldValue.delete() }, { merge: true });

    const existingLatihan = await ref.collection("Latihan").get();
    const newIds = new Set(latihan.map((item) => item.id));
    for (const docSnap of existingLatihan.docs) {
      if (!newIds.has(docSnap.id)) {
        await docSnap.ref.delete();
      }
    }

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