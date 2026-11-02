const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getAkun, updateAkun } = require("../controllers/akunController");

router.get("/", authMiddleware, getAkun);
router.put("/", authMiddleware, updateAkun);

module.exports = router;