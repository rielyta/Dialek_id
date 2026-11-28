const { auth, db } = require("../config/firebaseAdmin");

const URL_LOGIN_PASSWORD = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const PESAN_SALAH = "Username atau kata sandi salah.";
const BATAS_PANJANG = 100;

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function tidakDiizinkan(res) {
  return res.status(401).json({ error: "Unauthorized", message: PESAN_SALAH });
}

function serverError(res, message, err) {
  if (err) console.error("[masukController.masuk]", err);
  return res.status(500).json({ error: "InternalServerError", message });
}

// Username baru disimpan huruf kecil. Coba persis seperti yang diketik (untuk profil lama yang memuat
// huruf besar), lalu versi huruf kecil (untuk username baru yang diketik dengan huruf besar).
async function cariUidDariUsername(username) {
  const kandidat = [...new Set([username, username.toLowerCase()])];
  for (const k of kandidat) {
    const snap = await db.collection("Users").where("username", "==", k).limit(1).get();
    if (!snap.empty) return snap.docs[0].id;
  }
  return null;
}

// Verifikasi kata sandi lewat Firebase Authentication (REST). Email tidak pernah dikirim ke klien.
async function periksaKataSandi(email, password, apiKey) {
  const res = await fetch(`${URL_LOGIN_PASSWORD}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => ({}));
  const kode = String((body.error && body.error.message) || "");
  return { ok: false, kode };
}

// POST /api/akun/masuk (publik, tanpa token)
// Login dengan username dan kata sandi. Berhasil: mengembalikan customToken untuk signInWithCustomToken di klien.
async function masuk(req, res) {
  try {
    const { username, password } = req.body || {};

    if (typeof username !== "string" || username.trim() === "") {
      return badRequest(res, "Field username wajib diisi.");
    }
    if (typeof password !== "string" || password === "") {
      return badRequest(res, "Field password wajib diisi.");
    }
    if (username.length > BATAS_PANJANG || password.length > BATAS_PANJANG) {
      return badRequest(res, "Username atau kata sandi terlalu panjang.");
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      return serverError(res, "FIREBASE_WEB_API_KEY belum diisi di .env server.");
    }

    const uid = await cariUidDariUsername(username.trim());
    if (!uid) return tidakDiizinkan(res);

    let email;
    try {
      email = (await auth.getUser(uid)).email;
    } catch (e) {
      if (e.code === "auth/user-not-found") return tidakDiizinkan(res);
      throw e;
    }
    if (!email) return tidakDiizinkan(res);

    const hasil = await periksaKataSandi(email, password, apiKey);
    if (!hasil.ok) {
      if (hasil.kode.startsWith("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        return res.status(429).json({
          error: "TooManyRequests",
          message: "Terlalu banyak percobaan masuk. Coba lagi beberapa saat.",
        });
      }
      const gagalKredensial = ["INVALID_PASSWORD", "EMAIL_NOT_FOUND", "INVALID_LOGIN_CREDENTIALS", "USER_DISABLED"];
      if (gagalKredensial.some((k) => hasil.kode.startsWith(k))) return tidakDiizinkan(res);

      console.error("[masukController.masuk] Kode galat tak terduga dari Firebase:", hasil.kode);
      return serverError(res, "Layanan autentikasi tidak dapat dihubungi.");
    }

    const customToken = await auth.createCustomToken(uid);
    return res.status(200).json({ data: { customToken } });
  } catch (err) {
    return serverError(res, err.message, err);
  }
}

module.exports = { masuk };