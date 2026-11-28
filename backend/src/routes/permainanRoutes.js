const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { mulaiPermainan, kirimJawaban, akhiriPermainan } = require("../controllers/permainanController");

router.post("/mulai", authMiddleware, mulaiPermainan);
router.post("/:sesiId/jawaban", authMiddleware, kirimJawaban);
router.post("/:sesiId/akhiri", authMiddleware, akhiriPermainan);

module.exports = router;