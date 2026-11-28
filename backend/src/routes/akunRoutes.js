const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getAkun, buatAkun, updateAkun, hapusAkun } = require("../controllers/akunController");

router.use(authMiddleware);

router.get("/", getAkun);
router.post("/", buatAkun);
router.put("/", updateAkun);
router.delete("/", hapusAkun);

module.exports = router;