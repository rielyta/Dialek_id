const { db } = require("../config/firebaseAdmin");

async function getDashboard(req, res) {
  try {
    const uid = req.user.uid;

    const hasilSnap = await db
      .collection("HasilSusunKosakata")
      .where("uid", "==", uid)
      .get();

    const totalKosakataDipelajari = hasilSnap.size;
    let totalSkor = 0;
    hasilSnap.forEach((doc) => {
      totalSkor += Number(doc.data().skor) || 0;
    });
    const skorRataRataKosakata =
      totalKosakataDipelajari > 0
        ? Math.round((totalSkor / totalKosakataDipelajari) * 10) / 10
        : 0;


    const userDoc = await db.collection("Users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    return res.status(200).json({
      data: {
        totalKosakataDipelajari,
        skorRataRataKosakata,
        progresMateri: userData.progresMateri || [],
        permainanDimenangkan: userData.permainanDimenangkan || 0,
        peringkatLeaderboard: userData.peringkatLeaderboard || null,
      },
    });
  } catch (err) {
    console.error("[dashboardController.getDashboard]", err);
    return res.status(500).json({ error: "InternalServerError", message: err.message });
  }
}

module.exports = { getDashboard };