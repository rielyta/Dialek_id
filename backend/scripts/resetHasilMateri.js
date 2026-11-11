require("dotenv").config();
const { db } = require("../src/config/firebaseAdmin");

async function main() {
  await db.recursiveDelete(db.collection("Rating"));
  await db.recursiveDelete(db.collection("HasilLatihan"));
  console.log("Collection Rating dan HasilLatihan tingkat atas dihapus.");

  const materiSnap = await db.collection("Materi").get();
  for (const m of materiSnap.docs) {
    await m.ref.update({ totalRating: 0, jumlahRating: 0, ratingRataRata: 0 });
    await db.recursiveDelete(m.ref.collection("Rating"));
    await db.recursiveDelete(m.ref.collection("HasilLatihan"));
    console.log("Direset:", m.id);
  }
  console.log("Selesai.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});