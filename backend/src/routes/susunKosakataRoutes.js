const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getSoal, jawabSoal, getRingkasan } = require("../controllers/susunKosakataController");

router.use(authMiddleware);

router.get("/soal", getSoal);
router.post("/jawab", jawabSoal);
router.get("/ringkasan", getRingkasan);

module.exports = router;