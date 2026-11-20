const express = require("express");
const router = express.Router();

const { masuk } = require("../controllers/masukController");

// Endpoint publik: dipakai sebelum pengguna punya token.
router.post("/", masuk);

module.exports = router;