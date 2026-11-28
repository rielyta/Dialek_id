const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { kirimPesan, getRiwayat } = require("../controllers/chatbotController");

router.post("/", authMiddleware, kirimPesan);
router.get("/riwayat", authMiddleware, getRiwayat);

module.exports = router;