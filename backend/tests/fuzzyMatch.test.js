const test = require("node:test");
const assert = require("node:assert");
const { hitungSkor, nilaiJawaban, jarakLevenshtein, AMBANG_BATAS } = require("../src/services/fuzzyMatchEngine");

test("jawaban persis bernilai 100", () => {
  assert.strictEqual(hitungSkor("mangalap", "mangalap"), 100);
});

test("huruf besar dan spasi tepi diabaikan", () => {
  assert.strictEqual(hitungSkor("  MangaLap ", "mangalap"), 100);
});

test("satu typo pada kata panjang masih lulus", () => {
  const hasil = nilaiJawaban("mangalab", "mangalap");
  assert.strictEqual(hasil.skor, 88);
  assert.strictEqual(hasil.benar, true);
});

test("satu typo pada kata pendek tidak lulus", () => {
  const hasil = nilaiJawaban("hom", "hami");
  assert.strictEqual(hasil.benar, false);
});

test("jawaban jauh berbeda mendapat skor rendah", () => {
  assert.ok(hitungSkor("xxxx", "mangalap") < 20);
});

test("susunan huruf terbalik tidak lulus", () => {
  assert.strictEqual(nilaiJawaban("palagnam", "mangalap").benar, false);
});

test("jawaban kosong bernilai 0", () => {
  assert.strictEqual(hitungSkor("", "mangalap"), 0);
});

test("jarak Levenshtein dasar", () => {
  assert.strictEqual(jarakLevenshtein("kitten", "sitting"), 3);
});

test("ambang batas default 85", () => {
  assert.strictEqual(AMBANG_BATAS, 85);
});