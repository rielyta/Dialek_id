const { db } = require("../config/firebaseAdmin");

async function getAkun(req, res) {
  try {
    const uid = req.user.uid;
    const docRef = db.collection("Users").doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "NotFound",
        message: "Profil pengguna tidak ditemukan.",
      });
    }

    return res.status(200).json({ data: { uid, ...doc.data() } });
  } catch (err) {
    console.error("[akunController.getAkun]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

async function updateAkun(req, res) {
  try {
    const uid = req.user.uid;
    const { nama, fotoProfil, levelBahasa } = req.body;

    const dataUpdate = {};

    if (nama !== undefined) {
      if (typeof nama !== "string" || nama.trim() === "") {
        return res.status(400).json({
          error: "BadRequest",
          message: "Field nama tidak boleh kosong.",
        });
      }
      dataUpdate.nama = nama.trim();
    }

    if (fotoProfil !== undefined) {
      dataUpdate.fotoProfil = fotoProfil;
    }

    if (levelBahasa !== undefined) {
      const levelValid = ["Pemula", "Menengah", "Mahir"];
      if (!levelValid.includes(levelBahasa)) {
        return res.status(400).json({
          error: "BadRequest",
          message: `Field levelBahasa harus salah satu dari: ${levelValid.join(", ")}.`,
        });
      }
      dataUpdate.levelBahasa = levelBahasa;
    }

    if (Object.keys(dataUpdate).length === 0) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Tidak ada field yang dikirim untuk diubah.",
      });
    }

    const docRef = db.collection("Users").doc(uid);

    const existing = await docRef.get();
    if (!existing.exists) {
      dataUpdate.email = req.user.email || null;
      dataUpdate.tanggalBergabung = new Date().toISOString();
    }

    await docRef.set(dataUpdate, { merge: true });

    const docUpdated = await docRef.get();
    return res.status(200).json({ data: { uid, ...docUpdated.data() } });
  } catch (err) {
    console.error("[akunController.updateAkun]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

module.exports = { getAkun, updateAkun };