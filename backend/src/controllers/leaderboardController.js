const { ambilTop, ambilPeringkatPemain } = require("../services/leaderboardService");

const LIMIT_DEFAULT = 10;
const LIMIT_MAKS = 50;

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

    const [peringkat, saya] = await Promise.all([ambilTop(limit), ambilPeringkatPemain(req.user.uid)]);
    return res.status(200).json({ data: { peringkat, saya } });
  } catch (err) {
    return serverError(res, "getLeaderboard", err);
  }
}

module.exports = { getLeaderboard };