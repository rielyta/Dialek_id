require("dotenv").config();
const { db } = require("../src/config/firebaseAdmin");

// Konten Literasi Budaya Batak Toba. Seluruh isi ditulis ulang dengan bahasa sendiri dari satu sumber utama,
// dan halaman rujukannya dicatat di field `sumber`. Uraian mencerminkan keadaan pada masa penelitian Vergouwen
// (naskah aslinya terbit 1933), sehingga praktik masa kini bisa berbeda.
const SUMBER =
  "J. C. Vergouwen, The Social Organisation and Customary Law of the Toba-Batak of Northern Sumatra (The Hague: Martinus Nijhoff, 1964)";

const daftarKonten = [
  {
    id: "literasi-01",
    judul: "Marga dan Silsilah",
    kategori: "Kekerabatan",
    urutan: 1,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 21-35.`,
    isi:
      "Orang Batak Toba menarik garis keturunan dari pihak ayah. Setiap orang tahu ia berasal dari marga tertentu, dan marga-marga itu secara garis besar tergolong ke dalam dua rumpun besar, yaitu Lontung dan Sumba.\n\n" +
      "Menurut Vergouwen, kata marga sebenarnya lentur. Orang Batak memakainya untuk kelompok yang kecil maupun besar, tergantung apa yang sedang dibicarakan. Sebuah cabang baru disebut marga tersendiri setelah namanya dipakai secara mandiri, dan pada sebagian kelompok tandanya adalah larangan menikah antarcabang sudah dicabut.\n\n" +
      "Di bawah marga ada saompu, yaitu keturunan dari satu leluhur (ompu) yang sama. Orang yang memiliki keturunan banyak dan bercabang dianggap lebih beruntung daripada orang yang berdiri sendirian jauh dari kerabatnya.\n\n" +
      "Kelompok keturunan juga punya nama menurut hewan yang disantap bersama pada upacara: sapanganan manuk (ayam) untuk kelompok kecil, sapanganan babi dan sapanganan lombu (sapi) untuk yang lebih besar, dan sahordja horbo (kerbau) untuk cabang marga yang besar atau marga itu sendiri.",
  },
  {
    id: "literasi-02",
    judul: "Hula-hula dan Boru",
    kategori: "Kekerabatan",
    urutan: 2,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 44-48.`,
    isi:
      "Ketika seorang perempuan menikah, hubungannya dengan keluarga asalnya tidak terputus. Pernikahan menciptakan ikatan antarkeluarga yang disebut partondongan. Keluarga pihak pemberi pengantin perempuan disebut hula-hula, sedangkan keluarga pihak yang menerimanya, yaitu suami beserta keturunannya, disebut boru. Ikatan ini terus diwariskan ke generasi berikutnya.\n\n" +
      "Beberapa istilah penting: saudara laki-laki ibu disebut tulang, dan anak dari saudara perempuan disebut bere. Anak perempuan tulang bagi anak laki-laki saudara perempuannya disebut boru ni tulang. Pernikahan di antara mereka (manunduti) dianggap yang paling diharapkan karena memperkuat ikatan yang sudah ada, walaupun menurut Vergouwen kebiasaan itu makin jarang.\n\n" +
      "Ada aturan arah: perempuan tidak dinikahkan kembali ke hula-hula terdekat tempat ibu atau nenek ayahnya berasal. Hal itu membalik arah hubungan (marsungsang) dan dianggap bertentangan dengan tatanan. Dengan demikian, setiap orang berdiri di antara dua pihak: hula-hula di satu sisi dan boru di sisi lainnya.",
  },
  {
    id: "literasi-03",
    judul: "Ulos dan Piso",
    kategori: "Adat",
    urutan: 3,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 58-61.`,
    isi:
      "Dalam hubungan antarkerabat, pemberian dari hula-hula kepada boru disebut ulos, sedangkan pemberian dari boru kepada hula-hula disebut piso.\n\n" +
      "Ulos pada dasarnya adalah kain yang ditenun perempuan Batak dengan berbagai corak. Menurut kepercayaan lama, menenun adalah pekerjaan yang diliputi pantangan, dan kainnya dianggap membawa daya yang melindungi pemakainya. Saat ulos diberikan, kain dililitkan ke tubuh penerima sambil diucapkan kata-kata berkat.\n\n" +
      "Beberapa ulos punya fungsi khusus, misalnya ulos ni tondi yang diberikan orang tua kepada anak perempuannya yang sedang hamil anak pertama, dan ulos parompa, kain untuk menggendong bayi.\n\n" +
      "Istilah ulos juga dipakai untuk pemberian selain kain, misalnya tanah, ternak, dan beras. Tanah disebut ulos na so ra buruk, pakaian yang tidak pernah lapuk. Sebaliknya, piso berupa uang, ternak, atau beras, dan menurut Vergouwen tidak pernah berupa pisau sungguhan meskipun artinya pisau.",
  },
  {
    id: "literasi-04",
    judul: "Tondi dan Mangupa",
    kategori: "Kepercayaan",
    urutan: 4,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 79-86.`,
    isi:
      "Menurut pandangan tradisional Batak, setiap orang memiliki tondi, yaitu inti tak kasatmata yang biasa diterjemahkan sebagai jiwa. Tondi menyertai seseorang selama hidup, meninggalkannya sementara ketika ia sakit, dan pergi untuk selamanya saat ia meninggal.\n\n" +
      "Karena tondi dapat melemah, ada upacara untuk menguatkannya yang disebut mangupa. Mangupa dilakukan, antara lain, ketika seseorang baru lolos dari bahaya, sakit, atau tertimpa kemalangan terus-menerus, dan biasanya dengan pemberian makan, kain, atau tanah dari kerabat yang dipandang kaya akan sahala (wibawa dan daya berkat).\n\n" +
      "Beberapa contohnya: pemberian makan pangulahon kepada orang yang hendak bepergian jauh, upa sita-sita setelah seseorang kembali dengan selamat, dan marupa-upa pada kelahiran anak laki-laki yang menguatkan tondi ibu dan bayinya.\n\n" +
      "Catatan: ini uraian tentang kepercayaan tradisional pada masa penelitian, dan Vergouwen sendiri menyebut pengaruh agama Kristen sudah mengubahnya.",
  },
  {
    id: "literasi-05",
    judul: "Tahapan Perkawinan Adat",
    kategori: "Adat",
    urutan: 5,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 165-183.`,
    isi:
      "Anak muda dan anak gadis dahulu saling mengenal lewat martandang, yaitu kunjungan pemuda ke kampung gadis pada malam hari, dan lewat pasar, panen, atau acara bersama. Bila seorang pemuda hendak melamar (mangaririt), sebaiknya ia lebih dulu meminta restu tulangnya.\n\n" +
      "Lamaran sering disampaikan lewat perantara yang disebut domu-domu. Setelah ada kecocokan, kedua pihak merundingkan sinamot, yaitu pembayaran dari pihak pengantin laki-laki (paranak) kepada pihak pengantin perempuan (parboru). Kerabat dan hula-hula pihak laki-laki ikut menyumbang untuk mengumpulkannya.\n\n" +
      "Puncaknya adalah pertemuan besar yang disebut marunjuk, tempat sinamot diserahkan dan daging dihidangkan kepada pihak perempuan. Pihak perempuan membalas dengan ragi-ragi, antara lain ulos kepada orang tua mempelai laki-laki. Orang tua pengantin perempuan juga dapat memberi pauseang, bekal bagi putrinya.\n\n" +
      "Vergouwen mencatat bahwa anggapan menikahkan anak perempuan itu menguntungkan secara uang sering tidak tepat, karena pihak perempuan pun mengeluarkan banyak biaya untuk menjamu tamu dan membalas pemberian.",
  },
  {
    id: "literasi-06",
    judul: "Huta, Kampung Batak",
    kategori: "Kehidupan Sehari-hari",
    urutan: 6,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 105-108.`,
    isi:
      "Huta adalah kampung, satuan masyarakat Batak yang paling kecil. Bentuknya sebidang tanah persegi dengan halaman keras di tengah. Pada satu sisi berderet rumah, dan di seberangnya berderet lumbung padi. Seluruh kampung biasanya dikelilingi tembok atau pagar dengan rumpun bambu tinggi, kadang dengan parit.\n\n" +
      "Vergouwen menggambarkan huta sebagai dunia kecil yang tertutup: ada perempuan yang menenun di depan rumah, anak gadis yang menumbuk padi di losung, anak-anak bermain di bawah pohon, serta ternak yang berkeliaran di sekitar rumah.\n\n" +
      "Beberapa huta yang berdekatan dapat membentuk gugusan, dan masing-masing menyebut dirinya menurut leluhur atau marga pendirinya. Marga boru yang tinggal di kampung marga lain disebut boru yang menumpang di sana. Di atas huta ada wilayah kelompok marga yang lebih luas, dengan batas yang biasanya jelas, dan pasar (onan) di tengah wilayah itu menjadi tempat bertemu bahkan bagi kelompok yang sedang berselisih.",
  },
  {
    id: "literasi-07",
    judul: "Gondang dan Upacara Leluhur",
    kategori: "Seni dan Upacara",
    urutan: 7,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 34 dan 79.`,
    isi:
      "Dalam uraian Vergouwen, gondang adalah seperangkat gendang dan gong. Gondang dimainkan pada upacara untuk memanggil roh leluhur (sumangot ni ompu) dan memohon kehadiran serta restu mereka.\n\n" +
      "Alat musik ini dimainkan pada berbagai kesempatan, misalnya saat memberi nama kepada anak, meresmikan rumah, menolak penyakit dan bencana, atau menguburkan kembali tulang leluhur. Kelompok yang berkumpul untuk satu gondang disebut sagondang, dan artinya hampir sama dengan saompu karena pesertanya adalah keturunan leluhur yang sama.\n\n" +
      "Selama upacara gondang, suasana damai dijaga. Utang tidak boleh ditagih dan keributan dilarang, kecuali bagi pelaku kejahatan berat yang tidak dilindungi oleh ketentuan upacara itu. Vergouwen juga mencatat bahwa pemerintah dan misi kemudian melarang permainan gondang untuk upacara semacam itu.",
  },
  {
    id: "literasi-08",
    judul: "Umpama, Pepatah Batak",
    kategori: "Bahasa dan Pepatah",
    urutan: 8,
    gambarUrl: null,
    sumber: `${SUMBER}, hlm. 33, 61, dan 79.`,
    isi:
      "Umpama adalah pepatah yang sering dipakai orang Batak dalam adat, pidato, dan nasihat. Vergouwen mengutip banyak umpama untuk menjelaskan aturan adat. Tiga di antaranya:\n\n" +
      "1. \"Molo otik saompu, sori ni arina ma i; molo godang saompu, godang ni tuana ma i.\" Artinya, keturunan yang kecil rentan pada kemalangan, sedangkan keturunan yang besar menerima banyak berkat.\n\n" +
      "2. \"Hata na torop sabungan ni hata.\" Artinya, keputusan yang menentukan adalah hasil kata orang banyak, bukan pendapat satu orang.\n\n" +
      "3. \"Durung do boru, tomburan hula-hula.\" Artinya, boru bagaikan jaring penangkap ikan, sedangkan hula-hula bagaikan kolam tempat ikan itu berasal. Pepatah ini menggambarkan bahwa boru mengharapkan berkat dan pemberian dari hula-hula.",
  },
];

async function main() {
  for (const k of daftarKonten) {
    const { id, ...data } = k;
    await db.collection("LiterasiBudaya").doc(id).set({ kontenId: id, ...data }, { merge: true });
    console.log("OK:", id, "-", k.judul);
  }
  console.log("Selesai.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});