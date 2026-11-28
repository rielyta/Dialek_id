const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");

const data = new Map();
let urutan = 0;

function snapshot(path) {
  const value = data.get(path);
  return {
    exists: value !== undefined,
    id: path.split("/").pop(),
    data: () => (value ? { ...value } : undefined),
  };
}

function perbarui(path, values) {
  if (!data.has(path)) throw new Error("dokumen tidak ada");
  const existing = data.get(path);
  const updated = { ...existing };
  for (const [field, value] of Object.entries(values)) {
    updated[field] =
      value && typeof value.__increment === "number"
        ? (Number(existing[field]) || 0) + value.__increment
        : value;
  }
  data.set(path, updated);
}

function ref(path) {
  return {
    path,
    id: path.split("/").pop(),
    get: async () => snapshot(path),
    set: async (value) => data.set(path, { ...value }),
    update: async (value) => perbarui(path, value),
  };
}

function query(path, filters = [], batas = null) {
  const hasil = () => {
    let rows = [...data.entries()]
      .filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
      .filter(([, value]) =>
        filters.every(([field, operator, expected]) => {
          if (operator === "==") return value[field] === expected;
          if (operator === ">=") return value[field] >= expected;
          return false;
        }),
      );
    if (batas !== null) rows = rows.slice(0, batas);
    return rows;
  };

  return {
    where: (field, operator, value) => query(path, [...filters, [field, operator, value]], batas),
    limit: (value) => query(path, filters, value),
    get: async () => {
      const docs = hasil().map(([key]) => snapshot(key));
      return { docs, empty: docs.length === 0 };
    },
    count: () => ({ get: async () => ({ data: () => ({ count: hasil().length }) }) }),
  };
}

const db = {
  collection: (name) => ({
    doc: (id) => ref(`${name}/${id ?? `otomatis-${++urutan}`}`),
    ...query(name),
  }),
  runTransaction: async (callback) =>
    callback({
      get: (document) => document.get(),
      set: (document, value) => document.set(value),
      update: (document, value) => document.update(value),
    }),
};

const fieldValue = {
  increment: (value) => ({ __increment: value }),
};

const load = Module._load;
Module._load = function (request, parent, ...args) {
  if (request.endsWith("config/firebaseAdmin")) return { db };
  if (request === "firebase-admin/firestore") return { FieldValue: fieldValue };
  return load.call(this, request, parent, ...args);
};
const { getSoal, jawabSoal } = require("../src/controllers/susunKosakataController");
Module._load = load;

function panggil(handler, req) {
  return new Promise((resolve) => {
    handler(req, {
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        resolve({ code: this.code, body });
      },
    });
  });
}

function soal(uid = "u1") {
  return panggil(getSoal, { user: { uid } });
}

function jawab(kosakataId, jawaban, uid = "u1") {
  return panggil(jawabSoal, { user: { uid }, body: { kosakataId, jawaban } });
}

function tambahKosakata(id, kataBatak, fields) {
  data.set(`Kosakata/${id}`, {
    kataBatak,
    kataIndonesia: "arti",
    kategori: "kata",
    layakKuis: true,
    ...fields,
  });
}

test.beforeEach(() => {
  data.clear();
  urutan = 0;
  data.set("Users/u1", { expPoin: 0, kosakataPrioritasIndex: 0 });
  data.set("Users/u2", { expPoin: 0, kosakataPrioritasIndex: 0 });
  data.set("KosakataMeta/susunKosakata", { jumlahKuis: 3, jumlahPrioritas: 2, jumlahLain: 1 });
  tambahKosakata("prioritas-0", "horas", {
    prioritasPdf: true,
    nomorKuisPrioritas: 0,
  });
  tambahKosakata("prioritas-1", "sada", {
    prioritasPdf: true,
    nomorKuisPrioritas: 1,
  });
  tambahKosakata("lain-0", "aek", { prioritasPdf: false, nomorKuisLain: 0 });
});

test("mengulang kata prioritas yang salah sampai benar dan progres terpisah per pengguna", async () => {
  assert.equal((await soal("u1")).body.data.kosakataId, "prioritas-0");
  assert.equal((await soal("u2")).body.data.kosakataId, "prioritas-0");

  const salah = await jawab("prioritas-0", "zzzzz");
  assert.equal(salah.body.data.benar, false);
  assert.equal(data.get("Users/u1").kosakataPrioritasIndex, 0);
  assert.equal((await soal("u1")).body.data.kosakataId, "prioritas-0");

  const benar = await jawab("prioritas-0", "horas");
  assert.equal(benar.body.data.benar, true);
  assert.equal(data.get("Users/u1").kosakataPrioritasIndex, 1);
  assert.equal(data.get("Users/u2").kosakataPrioritasIndex, 0);
  assert.equal((await soal("u1")).body.data.kosakataId, "prioritas-1");
});

test("memilih kosakata lain setelah semua kata prioritas dijawab benar", async () => {
  data.set("Users/u1", { expPoin: 10, kosakataPrioritasIndex: 2 });
  const result = await soal("u1");
  assert.equal(result.body.data.kosakataId, "lain-0");
});
