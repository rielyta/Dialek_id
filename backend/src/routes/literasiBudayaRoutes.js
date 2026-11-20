const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getDaftarLiterasi, getDetailLiterasi, tandaiSelesai } = require("../controllers/literasiBudayaController");

router.use(authMiddleware);

router.get("/", getDaftarLiterasi);
router.get("/:id", getDetailLiterasi);
router.post("/:id/selesai", tandaiSelesai);

module.exports = router;