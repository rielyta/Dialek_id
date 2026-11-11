const { auth, db } = require("../config/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

const LEVEL_AWAL = "Pemula";
const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UKURAN_BATCH = 400;

function ambilProvider(user) {
  const p = user.firebase && user.firebase.sign_in_provider;
  return p === "google.com" ? "google" : "email";
}

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function serverError(res, nama, err) {
  console.error(`[akunController.${nama}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

function teksValid(nilai) {
  return typeof nilai === "string" && nilai.trim() !== "";
}

async function usernameDipakaiOrangLain(username, uid) {
  const snap = await db.collection("Users").where("username", "==", username).limit(2).get();
  return snap.docs.some((d) => d.id !== uid);
}

async function hapusDokumen(docs) {
  for (let i = 0; i < docs.length; i += UKURAN_BATCH) {
    const batch = db.batch();
    docs.slice(i, i + UKURAN_BATCH).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function hapusDataMateri(uid) {
  const materiSnap = await db.collection("Materi").get();

  for (const m of materiSnap.docs) {
    const materiRef = m.ref;
    const ratingRef = materiRef.collection("Rating").doc(uid);

    await db.runTransaction(async (t) => {
      const [materiDoc, ratingDoc] = await t.getAll(materiRef, ratingRef);
      if (!ratingDoc.exists) return;

      const d = materiDoc.data();
      const total = (d.totalRating || 0) - ratingDoc.data().nilai;
      const jumlah = Math.max((d.jumlahRating || 0) - 1, 0);
      const rataRata = jumlah > 0 ? Math.round((total / jumlah) * 10) / 10 : 0;

      t.delete(ratingRef);
      t.update(materiRef, { totalRating: total, jumlahRating: jumlah, ratingRataRata: rataRata });
    });

    const hasilSnap = await materiRef.collection("HasilLatihan").where("uid", "==", uid).get();
    await hapusDokumen(hasilSnap.docs);
  }
}

async function hapusDataKosakata(uid) {
  const snap = await db.collection("HasilSusunKosakata").where("uid", "==", uid).get();
  await hapusDokumen(snap.docs);
}

async function getAkun(req, res) {
  try {
    const uid = req.user.uid;
    const doc = await db.collection("Users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "NotFound",
        message: "Profil pengguna tidak ditemukan.",
      });
    }

    return res.status(200).json({ data: { uid, ...doc.data() } });
  } catch (err) {
    return serverError(res, "getAkun", err);
  }
}

async function buatAkun(req, res) {
  try {
    const uid = req.user.uid;
    const { username, nama } = req.body;

    if (!teksValid(username)) return badRequest(res, "Field username wajib diisi.");
    if (!teksValid(nama)) return badRequest(res, "Field nama wajib diisi.");

    const ref = db.collection("Users").doc(uid);
    if ((await ref.get()).exists) {
      return res.status(409).json({ error: "Conflict", message: "Profil pengguna sudah ada." });
    }
    if (await usernameDipakaiOrangLain(username.trim(), uid)) {
      return res.status(409).json({ error: "Conflict", message: "Username sudah dipakai." });
    }

    const data = {
      username: username.trim(),
      nama: nama.trim(),
      email: req.user.email || null,
      provider: ambilProvider(req.user),
      levelBudaya: LEVEL_AWAL,
      expPoin: 0,
      tanggalDaftar: new Date().toISOString(),
    };

    await ref.set(data);
    return res.status(201).json({ data: { uid, ...data } });
  } catch (err) {
    return serverError(res, "buatAkun", err);
  }
}

async function updateAkun(req, res) {
  try {
    const uid = req.user.uid;
    const { username, nama, email, password } = req.body;

    const ref = db.collection("Users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({
        error: "NotFound",
        message: "Profil pengguna tidak ditemukan.",
      });
    }
    const lama = doc.data();

    const dataUpdate = {};
    const authUpdate = {};

    if (username !== undefined) {
      if (!teksValid(username)) return badRequest(res, "Field username tidak boleh kosong.");
      if (await usernameDipakaiOrangLain(username.trim(), uid)) {
        return res.status(409).json({ error: "Conflict", message: "Username sudah dipakai." });
      }
      dataUpdate.username = username.trim();
    }

    if (nama !== undefined) {
      if (!teksValid(nama)) return badRequest(res, "Field nama tidak boleh kosong.");
      dataUpdate.nama = nama.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !FORMAT_EMAIL.test(email.trim())) {
        return badRequest(res, "Format email tidak valid.");
      }
      authUpdate.email = email.trim();
      dataUpdate.email = email.trim();
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return badRequest(res, "Password minimal 6 karakter.");
      }
      authUpdate.password = password;
    }

    if (Object.keys(dataUpdate).length === 0 && !authUpdate.password) {
      return badRequest(res, "Tidak ada field yang dikirim untuk diubah.");
    }

    if (Object.keys(authUpdate).length > 0) {
      try {
        await auth.updateUser(uid, authUpdate);
      } catch (e) {
        if (e.code === "auth/email-already-exists") {
          return res.status(409).json({ error: "Conflict", message: "Email sudah dipakai akun lain." });
        }
        if (e.code === "auth/invalid-email" || e.code === "auth/invalid-password") {
          return badRequest(res, e.message);
        }
        throw e;
      }
    }

    const bawaan = {};
    if (lama.provider === undefined) bawaan.provider = ambilProvider(req.user);
    if (lama.levelBudaya === undefined) bawaan.levelBudaya = LEVEL_AWAL;
    if (lama.expPoin === undefined) bawaan.expPoin = 0;
    if (lama.tanggalDaftar === undefined) {
      bawaan.tanggalDaftar = lama.tanggalBergabung || new Date().toISOString();
    }

    const hapusLama = {};
    for (const f of ["levelBahasa", "fotoProfil", "tanggalBergabung"]) {
      if (lama[f] !== undefined) hapusLama[f] = FieldValue.delete();
    }

    await ref.set({ ...bawaan, ...dataUpdate, ...hapusLama }, { merge: true });

    const terbaru = await ref.get();
    return res.status(200).json({ data: { uid, ...terbaru.data() } });
  } catch (err) {
    return serverError(res, "updateAkun", err);
  }
}

async function hapusAkun(req, res) {
  try {
    const uid = req.user.uid;

    await hapusDataMateri(uid);
    await hapusDataKosakata(uid);
    await db.collection("Users").doc(uid).delete();

    try {
      await auth.deleteUser(uid);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    return res.status(200).json({ data: { message: "Akun berhasil dihapus." } });
  } catch (err) {
    return serverError(res, "hapusAkun", err);
  }
}

module.exports = { getAkun, buatAkun, updateAkun, hapusAkun };