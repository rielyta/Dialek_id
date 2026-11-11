const AMBANG_BATAS = Number(process.env.FUZZY_AMBANG_BATAS) || 85;

function normalisasiTeks(teks) {
  return String(teks).toLowerCase().trim().replace(/\s+/g, " ");
}

function jarakLevenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let sebelum = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const sekarang = [i];
    for (let j = 1; j <= b.length; j++) {
      const biaya = a[i - 1] === b[j - 1] ? 0 : 1;
      sekarang[j] = Math.min(sebelum[j] + 1, sekarang[j - 1] + 1, sebelum[j - 1] + biaya);
    }
    sebelum = sekarang;
  }
  return sebelum[b.length];
}

function hitungSkor(jawaban, kunci) {
  const jawabanNormal = normalisasiTeks(jawaban);
  const kunciNormal = normalisasiTeks(kunci);
  const panjangMaks = Math.max(jawabanNormal.length, kunciNormal.length);
  if (panjangMaks === 0) return 0;

  const jarak = jarakLevenshtein(jawabanNormal, kunciNormal);
  const skor = (1 - jarak / panjangMaks) * 100;
  return Math.max(0, Math.round(skor));
}

function nilaiJawaban(jawaban, kunci) {
  const skor = hitungSkor(jawaban, kunci);
  return { skor, benar: skor >= AMBANG_BATAS };
}

module.exports = { AMBANG_BATAS, normalisasiTeks, jarakLevenshtein, hitungSkor, nilaiJawaban };