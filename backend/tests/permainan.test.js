const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

// ---------- Firestore tiruan di memori (cukup untuk yang dipakai controller dan service) ----------
const data = new Map();
let urutan = 0;

const anak = (path) =>
  [...data.keys()].filter((k) => k.startsWith(path + "/") && !k.slice(path.length + 1).includes("/"));

function snapshot(path) {
  const v = data.get(path);
  return { exists: v !== undefined, id: path.split("/").pop(), data: () => (v ? { ...v } : undefined) };
}

function ref(path) {
  return {
    path,
    id: path.split("/").pop(),
    get: async () => snapshot(path),
    set: async (v, opsi) => {
      data.set(path, opsi && opsi.merge ? { ...(data.get(path) || {}), ...v } : { ...v });
    },
    update: async (v) => {
      if (!data.has(path)) throw new Error("dokumen tidak ada");
      data.set(path, { ...data.get(path), ...v });
    },
    collection: (nama) => koleksi(`${path}/${nama}`),
  };
}

const OPERATOR = {
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  ">": (a, b) => a > b,
  "==": (a, b) => a === b,
};

function kueri(path, filter = [], urut = null, batas = null) {
  const hasil = () => {
    let daftar = anak(path)
      .map((k) => ({ k, v: data.get(k) }))
      .filter(({ v }) => filter.every(([f, op, nilai]) => OPERATOR[op](v[f], nilai)));
    if (urut) {
      const [f, arah] = urut;
      daftar.sort((a, b) => (arah === "desc" ? b.v[f] - a.v[f] : a.v[f] - b.v[f]));
    }
    if (batas !== null) daftar = daftar.slice(0, batas);
    return daftar;
  };
  return {
    where: (f, op, nilai) => kueri(path, [...filter, [f, op, nilai]], urut, batas),
    orderBy: (f, arah = "asc") => kueri(path, filter, [f, arah], batas),
    limit: (n) => kueri(path, filter, urut, n),
    get: async () => ({ docs: hasil().map(({ k }) => snapshot(k)) }),
    count: () => ({ get: async () => ({ data: () => ({ count: hasil().length }) }) }),
  };
}

function koleksi(path) {
  return {
    doc: (id) => ref(`${path}/${id ?? "otomatis" + ++urutan}`),
    ...kueri(path),
  };
}

const db = {
  collection: (nama) => koleksi(nama),
  runTransaction: async (fn) => {
    const tx = {
      get: (r) => r.get(),
      set: (r, v, opsi) => r.set(v, opsi),
      update: (r, v) => r.update(v),
    };
    // Penulisan tx tiruan berjalan langsung (async); tunggu semuanya selesai.
    await fn(tx);
    await new Promise((selesai) => setImmediate(selesai));
  },
};

// ---------- Tiruan modul ----------
const KOSAKATA = ["horas", "sada", "aek", "kata", "asa", "anak", "kapal"];
const layananPermainan = {
  normalisasiKata: (k) => String(k).toLowerCase().trim().replace(/\s+/g, " "),
  hurufTerakhir: (k) => k.slice(-1),
  kataAda: async (k) => KOSAKATA.includes(k),
  cariKataDenganAwalan: async (huruf, terpakai) =>
    KOSAKATA.find((k) => k.startsWith(huruf) && !terpakai.includes(k)) ?? null,
  pilihKataAwal: async () => "horas",
};
const Timestamp = {
  now: () => {
    const ms = Date.now();
    return { toDate: () => new Date(ms), toMillis: () => ms };
  },
};

const asli = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request.endsWith("config/firebaseAdmin")) return { db };
  if (request === "firebase-admin/firestore") return { Timestamp };
  if (request.endsWith("services/permainanService")) return layananPermainan;
  return asli.call(this, request, parent, ...rest);
};
const { mulaiPermainan, kirimJawaban, akhiriPermainan } = require("../src/controllers/permainanController");
const { getLeaderboard } = require("../src/controllers/leaderboardController");
const { tanggalHariIni } = require("../src/services/leaderboardService");

// ---------- Alat bantu ----------
const resmi = (fn, req) =>
  new Promise((selesai) => {
    fn(req, { status(k) { this.k = k; return this; }, json(b) { selesai({ kode: this.k, body: b }); } });
  });

const mulai = (uid = "u1") => resmi(mulaiPermainan, { user: { uid } });
const jawab = (sesiId, kata, uid = "u1") => resmi(kirimJawaban, { user: { uid }, params: { sesiId }, body: { kata } });
const akhiri = (sesiId, uid = "u1") => resmi(akhiriPermainan, { user: { uid }, params: { sesiId } });
const leaderboard = (query = {}, uid = "u1") => resmi(getLeaderboard, { user: { uid }, query });

const WAKTU_AWAL = Date.parse("2026-11-20T03:00:00Z"); // 10.00 WIB
const asliNow = Date.now;
let sekarang;
const maju = (detik) => { sekarang += detik * 1000; };

test.beforeEach(() => {
  data.clear();
  urutan = 0;
  sekarang = WAKTU_AWAL;
  Date.now = () => sekarang;
  data.set("Users/u1", { nama: "Desi" });
  data.set("Users/u2", { nama: "Ani" });
});
test.after(() => { Date.now = asliNow; });

// ---------- Sesi permainan ----------
test("mulai: sesi memuat durasi 60 detik dan skor sistem 0", async () => {
  const r = await mulai();
  assert.strictEqual(r.kode, 201);
  assert.strictEqual(r.body.data.durasiDetik, 60);
  assert.strictEqual(r.body.data.skorSistem, 0);
  assert.strictEqual(r.body.data.kataAwal, "horas");
});

test("jawaban valid: skor pemain 10 dan skor sistem 10 setelah sistem menyambung", async () => {
  const { body } = await mulai();
  const r = await jawab(body.data.sesiId, "Sada");
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.valid, true);
  assert.strictEqual(r.body.data.kataSistem, "aek");
  assert.strictEqual(r.body.data.sesi.skor, 10);
  assert.strictEqual(r.body.data.sesi.skorSistem, 10);
});

test("skor sistem tidak menghitung kata awal", async () => {
  const { body } = await mulai();
  assert.strictEqual(body.data.skorSistem, 0);
  const r = await jawab(body.data.sesiId, "sada");
  const r2 = await jawab(body.data.sesiId, "kata");
  assert.strictEqual(r2.body.data.sesi.skorSistem, 20);
  assert.strictEqual(r.body.data.sesi.skor, 10);
});

test("jawaban pada detik ke-62 masih diterima (toleransi jaringan)", async () => {
  const { body } = await mulai();
  maju(62);
  const r = await jawab(body.data.sesiId, "sada");
  assert.strictEqual(r.body.data.valid, true);
  assert.strictEqual(r.body.data.sesi.skor, 10);
});

test("jawaban setelah batas waktu ditolak, sesi selesai dengan alasan waktu_habis", async () => {
  const { body } = await mulai();
  await jawab(body.data.sesiId, "sada");
  maju(64);
  const r = await jawab(body.data.sesiId, "kata");
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.valid, false);
  assert.strictEqual(r.body.data.alasan, "waktu_habis");
  assert.strictEqual(r.body.data.sesi.status, "selesai");
  assert.strictEqual(r.body.data.sesi.skor, 10, "kata yang terlambat tidak menambah skor");
  assert.strictEqual(r.body.data.sesi.alasanSelesai, "waktu_habis");
});

test("jawaban terlambat pada sesi bernilai 0 tidak membuat entri leaderboard", async () => {
  const { body } = await mulai();
  maju(70);
  await jawab(body.data.sesiId, "sada");
  assert.strictEqual(data.has("Leaderboard/u1"), false);
  assert.strictEqual([...data.keys()].some((k) => k.startsWith("LeaderboardHarian/")), false);
});

test("sesi yang sudah berakhir karena waktu habis menjawab 409 pada jawaban berikutnya", async () => {
  const { body } = await mulai();
  maju(70);
  await jawab(body.data.sesiId, "sada");
  const r = await jawab(body.data.sesiId, "sada");
  assert.strictEqual(r.kode, 409);
});

// ---------- Leaderboard harian ----------
test("akhiri: skor tersimpan di leaderboard harian dan semua waktu, rekorBaru true", async () => {
  const { body } = await mulai();
  await jawab(body.data.sesiId, "sada");
  const r = await akhiri(body.data.sesiId);
  assert.strictEqual(r.body.data.rekorBaru, true);
  const hari = tanggalHariIni(sekarang);
  assert.strictEqual(data.get(`LeaderboardHarian/${hari}/Skor/u1`).skorTertinggi, 10);
  assert.strictEqual(data.get(`LeaderboardHarian/${hari}/Skor/u1`).nama, "Desi");
  assert.strictEqual(data.get("Leaderboard/u1").skorTertinggi, 10);
});

test("skor lebih rendah pada hari yang sama tidak menjadi rekor dan tidak menimpa", async () => {
  let s = (await mulai()).body.data.sesiId;
  await jawab(s, "sada");
  await jawab(s, "kata");
  await akhiri(s);
  s = (await mulai()).body.data.sesiId;
  await jawab(s, "sada");
  const r = await akhiri(s);
  assert.strictEqual(r.body.data.rekorBaru, false);
  const hari = tanggalHariIni(sekarang);
  assert.strictEqual(data.get(`LeaderboardHarian/${hari}/Skor/u1`).skorTertinggi, 20);
});

test("hari berikutnya skor kecil tetap rekor harian, rekor semua waktu tidak turun", async () => {
  let s = (await mulai()).body.data.sesiId;
  await jawab(s, "sada");
  await jawab(s, "kata");
  await akhiri(s); // skor 20
  maju(24 * 3600);
  s = (await mulai()).body.data.sesiId;
  await jawab(s, "sada");
  const r = await akhiri(s); // skor 10
  assert.strictEqual(r.body.data.rekorBaru, true, "rekor dihitung terhadap skor hari itu");
  assert.strictEqual(data.get("Leaderboard/u1").skorTertinggi, 20, "skor semua waktu tidak diturunkan");
  assert.strictEqual(data.get(`LeaderboardHarian/${tanggalHariIni(sekarang)}/Skor/u1`).skorTertinggi, 10);
});

test("tanggal mengikuti WIB: 17.30 UTC sudah hari berikutnya", () => {
  assert.strictEqual(tanggalHariIni(Date.parse("2026-11-20T17:30:00Z")), "2026-11-21");
  assert.strictEqual(tanggalHariIni(Date.parse("2026-11-20T16:59:00Z")), "2026-11-20");
});

// ---------- GET /api/leaderboard ----------
function isiHarian(skorPerUid) {
  const hari = tanggalHariIni(sekarang);
  Object.entries(skorPerUid).forEach(([uid, skor]) => {
    data.set(`LeaderboardHarian/${hari}/Skor/${uid}`, { uid, nama: uid.toUpperCase(), tanggal: hari, skorTertinggi: skor });
  });
}

test("leaderboard bawaan adalah harian, terurut, skor sama berbagi peringkat", async () => {
  isiHarian({ a: 50, b: 30, c: 30, d: 10 });
  data.set("Leaderboard/z", { uid: "z", nama: "Lama", skorTertinggi: 999 });
  const r = await leaderboard({}, "b");
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.periode, "harian");
  assert.strictEqual(r.body.data.tanggal, tanggalHariIni(sekarang));
  assert.deepStrictEqual(r.body.data.peringkat.map((p) => [p.uid, p.peringkat]), [["a", 1], ["b", 2], ["c", 2], ["d", 4]]);
  assert.strictEqual(r.body.data.saya.peringkat, 2);
});

test("leaderboard harian hari ini tidak memuat skor hari kemarin", async () => {
  data.set("LeaderboardHarian/2026-11-19/Skor/a", { uid: "a", nama: "A", skorTertinggi: 500 });
  isiHarian({ b: 20 });
  const r = await leaderboard();
  assert.deepStrictEqual(r.body.data.peringkat.map((p) => p.uid), ["b"]);
  assert.strictEqual(r.body.data.saya, null);
});

test("periode=semua memakai leaderboard semua waktu", async () => {
  data.set("Leaderboard/z", { uid: "z", nama: "Lama", skorTertinggi: 999 });
  isiHarian({ b: 20 });
  const r = await leaderboard({ periode: "semua" });
  assert.strictEqual(r.body.data.periode, "semua");
  assert.strictEqual(r.body.data.tanggal, null);
  assert.deepStrictEqual(r.body.data.peringkat.map((p) => p.uid), ["z"]);
});

test("periode tidak valid dan limit tidak valid mendapat 400", async () => {
  assert.strictEqual((await leaderboard({ periode: "mingguan" })).kode, 400);
  assert.strictEqual((await leaderboard({ limit: "0" })).kode, 400);
  assert.strictEqual((await leaderboard({ limit: "51" })).kode, 400);
});

test("distribusi menghitung pemain per rentang skor harian", async () => {
  isiHarian({ a: 30, b: 60, c: 120, d: 120, e: 210, f: 49, g: 50, h: 199, i: 200 });
  const r = await leaderboard();
  const d = r.body.data.distribusi;
  assert.deepStrictEqual(d.map((x) => x.label), ["1-49", "50-99", "100-149", "150-199", "200+"]);
  assert.deepStrictEqual(d.map((x) => x.jumlah), [2, 2, 2, 1, 2]);
  assert.strictEqual(d[4].batasAtas, null);
});

test("belum ada skor hari ini: daftar kosong, distribusi nol, saya null", async () => {
  const r = await leaderboard();
  assert.deepStrictEqual(r.body.data.peringkat, []);
  assert.strictEqual(r.body.data.saya, null);
  assert.deepStrictEqual(r.body.data.distribusi.map((x) => x.jumlah), [0, 0, 0, 0, 0]);
});