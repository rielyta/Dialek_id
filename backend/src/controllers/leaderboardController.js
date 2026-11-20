const {
  PERIODE_VALID,
  tanggalHariIni,
  ambilTop,
  ambilPeringkatPemain,
  ambilDistribusi,
} = require("../services/leaderboardService");

const LIMIT_DEFAULT = 10;
const LIMIT_MAKS = 50;
const PERIODE_DEFAULT = "harian";

function badRequest(res, message) {
  return res.status(400).json({ error: "BadRequest", message });
}

function serverError(res, fungsi, err) {
  console.error(`[leaderboardController.${fungsi}]`, err);
  return res.status(500).json({ error: "InternalServerError", message: err.message });
}

// GET /api/leaderboard
async function getLeaderboard(req, res) {
  try {
    let limit = LIMIT_DEFAULT;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT_MAKS) {
        return badRequest(res, `limit harus bilangan bulat 1 sampai ${LIMIT_MAKS}.`);
      }
    }

    const periode = req.query.periode ?? PERIODE_DEFAULT;
    if (!PERIODE_VALID.includes(periode)) {
      return badRequest(res, `periode harus salah satu dari: ${PERIODE_VALID.join(", ")}.`);
    }

    const tanggal = tanggalHariIni();
    const [peringkat, saya, distribusi] = await Promise.all([
      ambilTop(limit, periode, tanggal),
      ambilPeringkatPemain(req.user.uid, periode, tanggal),
      ambilDistribusi(periode, tanggal),
    ]);

    return res.status(200).json({
      data: {
        periode,
        tanggal: periode === "harian" ? tanggal : null,
        peringkat,
        saya,
        distribusi,
      },
    });
  } catch (err) {
    return serverError(res, "getLeaderboard", err);
  }
}

module.exports = { getLeaderboard };