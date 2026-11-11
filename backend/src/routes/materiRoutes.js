const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getDaftarMateri,
  getDetailMateri,
  kirimRating,
  jawabLatihan,
} = require("../controllers/materiController");

router.use(authMiddleware);

router.get("/", getDaftarMateri);
router.get("/:id", getDetailMateri);
router.post("/:id/rating", kirimRating);
router.post("/:id/latihan/jawaban", jawabLatihan);

module.exports = router;