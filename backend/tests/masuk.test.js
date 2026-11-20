const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");

const users = {
  uid1: { username: "desi_m" },
  uid2: { username: "Budi" },
  uid3: { username: "hantu" },
};
const emailAuth = { uid1: "desi@example.com", uid2: "budi@example.com" };

const db = {
  collection: () => ({
    where: (_k, _o, v) => ({
      limit: () => ({
        get: async () => {
          const id = Object.keys(users).find((u) => users[u].username === v);
          return { empty: !id, docs: id ? [{ id }] : [] };
        },
      }),
    }),
  }),
};
const auth = {
  getUser: async (uid) => {
    if (!(uid in emailAuth)) {
      const e = new Error("tidak ada");
      e.code = "auth/user-not-found";
      throw e;
    }
    return { uid, email: emailAuth[uid] };
  },
  createCustomToken: async (uid) => `token-untuk-${uid}`,
};

const asli = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request.endsWith("config/firebaseAdmin")) return { db, auth };
  return asli.call(this, request, parent, ...rest);
};
const { masuk } = require("../src/controllers/masukController");

const jalankan = (body) =>
  new Promise((selesai) => {
    masuk({ body }, { status(k) { this.k = k; return this; }, json(b) { selesai({ kode: this.k, body: b }); } });
  });

function tiruFetch(perilaku) {
  global.fetch = async (_url, opsi) => {
    const { password } = JSON.parse(opsi.body);
    if (perilaku) return perilaku(password);
    if (password === "rahasia123") return { ok: true, json: async () => ({}) };
    return { ok: false, json: async () => ({ error: { message: "INVALID_LOGIN_CREDENTIALS" } }) };
  };
}

test.beforeEach(() => {
  process.env.FIREBASE_WEB_API_KEY = "kunci-uji";
  tiruFetch();
});

test("username dan kata sandi benar mengembalikan customToken", async () => {
  const r = await jalankan({ username: "desi_m", password: "rahasia123" });
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.customToken, "token-untuk-uid1");
});

test("email pengguna tidak pernah muncul di respons", async () => {
  const r = await jalankan({ username: "desi_m", password: "rahasia123" });
  assert.ok(!JSON.stringify(r.body).includes("@"));
});

test("username tidak dikenal mendapat 401 dengan pesan yang sama", async () => {
  const r = await jalankan({ username: "tidakada", password: "rahasia123" });
  assert.strictEqual(r.kode, 401);
  assert.strictEqual(r.body.message, "Username atau kata sandi salah.");
});

test("kata sandi salah mendapat 401 dengan pesan yang sama", async () => {
  const r = await jalankan({ username: "desi_m", password: "salah" });
  assert.strictEqual(r.kode, 401);
  assert.strictEqual(r.body.message, "Username atau kata sandi salah.");
});

test("username diketik dengan huruf besar tetap cocok dengan username huruf kecil", async () => {
  const r = await jalankan({ username: "Desi_M", password: "rahasia123" });
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.customToken, "token-untuk-uid1");
});

test("profil lama dengan huruf besar cocok bila diketik persis", async () => {
  const r = await jalankan({ username: "Budi", password: "rahasia123" });
  assert.strictEqual(r.kode, 200);
  assert.strictEqual(r.body.data.customToken, "token-untuk-uid2");
});

test("profil tanpa akun di Authentication mendapat 401", async () => {
  const r = await jalankan({ username: "hantu", password: "rahasia123" });
  assert.strictEqual(r.kode, 401);
});

test("terlalu banyak percobaan mendapat 429", async () => {
  tiruFetch(async () => ({ ok: false, json: async () => ({ error: { message: "TOO_MANY_ATTEMPTS_TRY_LATER : blokir sementara" } }) }));
  const r = await jalankan({ username: "desi_m", password: "x" });
  assert.strictEqual(r.kode, 429);
});

test("kode galat tak terduga dari Firebase menjadi 500", async () => {
  tiruFetch(async () => ({ ok: false, json: async () => ({ error: { message: "API_KEY_INVALID" } }) }));
  const r = await jalankan({ username: "desi_m", password: "rahasia123" });
  assert.strictEqual(r.kode, 500);
});

test("field kosong atau bukan teks mendapat 400", async () => {
  assert.strictEqual((await jalankan({ password: "x" })).kode, 400);
  assert.strictEqual((await jalankan({ username: "  ", password: "x" })).kode, 400);
  assert.strictEqual((await jalankan({ username: "desi_m" })).kode, 400);
  assert.strictEqual((await jalankan({ username: 123, password: "x" })).kode, 400);
  assert.strictEqual((await jalankan(undefined)).kode, 400);
});

test("input terlalu panjang mendapat 400", async () => {
  const r = await jalankan({ username: "a".repeat(101), password: "x" });
  assert.strictEqual(r.kode, 400);
});

test("tanpa FIREBASE_WEB_API_KEY mendapat 500 yang jelas", async () => {
  delete process.env.FIREBASE_WEB_API_KEY;
  const r = await jalankan({ username: "desi_m", password: "rahasia123" });
  assert.strictEqual(r.kode, 500);
  assert.ok(r.body.message.includes("FIREBASE_WEB_API_KEY"));
});