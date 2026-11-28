require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const berkas = process.argv.find((a) => a.endsWith(".csv")) || path.join(__dirname, "..", "data", "kamus_batak_toba_bersih_rapi.csv");
const dryRun = process.argv.includes("--dry");
const pdfHeadwordHashes = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, "kamusBatakTobaPdfHeadwordHashes.json"), "utf-8")),
);

function hashHeadword(kataBatak) {
  const normal = kataBatak.trim().toLowerCase().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normal).digest("hex").slice(0, 32);
}

function ambilGlos(definisi) {
  const awal = definisi.split(/[;,]/)[0].trim().toLowerCase();
  return awal.replace(/\s+/g, " ");
}

function layakKuis(kataBatak, glos, definisi) {
  if (!/^[a-z]{3,}$/.test(kataBatak)) return false;
  if (!glos || glos === kataBatak) return false;
  if (glos.includes(kataBatak)) return false;
  if (/^(seruan|lih\.)/.test(glos)) return false;
  if (/^lih\./i.test(definisi)) return false;
  if (/[0-9()]/.test(glos)) return false;
  if (glos.split(" ").length > 3) return false;
  if (glos.length > 30) return false;
  return true;
}

function bacaBaris() {
  const teks = fs.readFileSync(berkas, "utf-8");
  return parse(teks, {
    columns: true,
    delimiter: ";",
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
}

function bentukDokumen(baris) {
  const hitung = {};
  const hasil = [];
  let nomor = 0;
  let nomorPrioritas = 0;
  let nomorLain = 0;

  for (const b of baris) {
    const kataBatak = (b.headword || "").trim().toLowerCase();
    const definisi = (b.definition || "").trim();
    if (!kataBatak || !definisi) continue;

    const dasar = kataBatak.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kata";
    hitung[dasar] = (hitung[dasar] || 0) + 1;
    const id = hitung[dasar] === 1 ? dasar : `${dasar}-${hitung[dasar]}`;

    const glos = ambilGlos(definisi);
    const kuis = layakKuis(kataBatak, glos, definisi);
    const prioritasPdf = pdfHeadwordHashes.has(hashHeadword(kataBatak));

    const data = {
      kosakataId: id,
      kataBatak,
      kataIndonesia: glos,
      definisi,
      kategori: (b.category || "").trim().toLowerCase(),
      layakKuis: kuis,
      prioritasPdf,
    };
    if (kuis) {
      data.nomorKuis = nomor;
      nomor += 1;
      if (prioritasPdf) {
        data.nomorKuisPrioritas = nomorPrioritas;
        nomorPrioritas += 1;
      } else {
        data.nomorKuisLain = nomorLain;
        nomorLain += 1;
      }
    }
    hasil.push({ id, data });
  }
  return { dokumen: hasil, jumlahPrioritas: nomorPrioritas, jumlahLain: nomorLain };
}

async function main() {
  const { dokumen, jumlahPrioritas, jumlahLain } = bentukDokumen(bacaBaris());
  const kuis = dokumen.filter((d) => d.data.layakKuis);
  console.log(`Total baris valid : ${dokumen.length}`);
  console.log(`Layak kuis        : ${kuis.length}`);
  console.log(`Prioritas PDF     : ${jumlahPrioritas}`);
  console.log(`Kosakata lainnya  : ${jumlahLain}`);

  if (dryRun) {
    console.log("Mode --dry: tidak menulis ke Firestore.");
    kuis.slice(0, 8).forEach((d) => console.log(`${d.data.nomorKuis}: ${d.data.kataIndonesia} => ${d.data.kataBatak}`));
    return;
  }

  const { db } = require("../src/config/firebaseAdmin");
  let batch = db.batch();
  let n = 0;
  let total = 0;
  for (const d of dokumen) {
    batch.set(db.collection("Kosakata").doc(d.id), d.data);
    n++;
    total++;
    if (n === 450) {
      await batch.commit();
      batch = db.batch();
      n = 0;
      console.log(`Terkirim ${total}/${dokumen.length}`);
    }
  }
  if (n > 0) await batch.commit();
  await db.collection("KosakataMeta").doc("susunKosakata").set({
    jumlahKuis: kuis.length,
    jumlahPrioritas,
    jumlahLain,
  });
  console.log(`Selesai: ${total} dokumen masuk ke Kosakata.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});