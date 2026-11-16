const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getDaftarTopik,
  buatTopik,
  getDetailTopik,
  balasTopik,
} = require("../controllers/forumController");

router.get("/", authMiddleware, getDaftarTopik);
router.post("/", authMiddleware, buatTopik);
router.get("/:topikId", authMiddleware, getDetailTopik);
router.post("/:topikId/balasan", authMiddleware, balasTopik);

module.exports = router;