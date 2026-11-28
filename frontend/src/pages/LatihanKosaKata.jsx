import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaPlay,
  FaRedo,
  FaSpellCheck,
  FaTimesCircle,
} from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilSoal, kirimJawaban } from "../service/susunKosakata";

export default function LatihanKosaKata() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mulai, setMulai] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [soal, setSoal] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const [galatSoal, setGalatSoal] = useState("");
  const [slots, setSlots] = useState([]);
  const [hasil, setHasil] = useState(null);
  const [mengirim, setMengirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState("");

  const keLogin = useCallback(() => navigate("/auth/login", { replace: true }), [navigate]);

  const muatSoal = useCallback(async () => {
    setMemuat(true);
    setGalatSoal("");
    setHasil(null);
    setGalatKirim("");
    try {
      const s = await ambilSoal();
      setSoal(s);
      setSlots(Array(s.hurufAcak.length).fill(null));
    } catch (e) {
      if (e.status === 401) return keLogin();
      setSoal(null);
      setGalatSoal(e.status === 404 ? "Data kosakata belum tersedia." : e.message);
    } finally {
      setMemuat(false);
    }
  }, [keLogin]);

  useEffect(() => {
    muatSoal();
  }, [muatSoal]);

  const handleMulai = () => {
    setRiwayat([]);
    setSelesai(false);
    setMulai(true);
    if (!soal && !memuat) {
      muatSoal();
    }
  };

  const terpakai = new Set(slots.filter((n) => n !== null));
  const penuh = soal && slots.length > 0 && slots.every((n) => n !== null);
  const terjawab = hasil !== null;

  const isi = useCallback((nomorAbjad) => {
    setSlots((lama) => {
      const kosong = lama.indexOf(null);
      if (kosong === -1 || lama.includes(nomorAbjad)) return lama;
      const baru = [...lama];
      baru[kosong] = nomorAbjad;
      return baru;
    });
  }, []);

  const kosongkan = useCallback((posisi) => {
    setSlots((lama) => {
      const baru = [...lama];
      baru[posisi] = null;
      return baru;
    });
  }, []);

  useEffect(() => {
    if (!mulai || selesai || !soal || terjawab) return undefined;
    function tekan(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Backspace") {
        setSlots((lama) => {
          const terisi = lama.map((n, i) => (n === null ? -1 : i)).filter((i) => i >= 0);
          if (terisi.length === 0) return lama;
          const baru = [...lama];
          baru[terisi[terisi.length - 1]] = null;
          return baru;
        });
        return;
      }
      if (e.key.length !== 1) return;
      setSlots((lama) => {
        const kosong = lama.indexOf(null);
        if (kosong === -1) return lama;
        const dipakai = new Set(lama.filter((n) => n !== null));
        const nomor = soal.hurufAcak.findIndex(
          (h, i) => !dipakai.has(i) && h.toLowerCase() === e.key.toLowerCase()
        );
        if (nomor === -1) return lama;
        const baru = [...lama];
        baru[kosong] = nomor;
        return baru;
      });
    }
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [mulai, selesai, soal, terjawab]);

  async function periksa() {
    setMengirim(true);
    setGalatKirim("");
    try {
      const jawaban = slots.map((n) => soal.hurufAcak[n]).join("");
      const res = await kirimJawaban(soal.kosakataId, jawaban);
      setHasil(res);
      setRiwayat((lama) => [
        ...lama,
        {
          kataIndonesia: soal.kataIndonesia,
          jawabanUser: jawaban,
          kataBenar: res.kataBenar,
          benar: Boolean(res.benar),
          skor: Math.max(0, Math.min(100, Math.round(res.skor))),
        },
      ]);
    } catch (e) {
      if (e.status === 401) return keLogin();
      setGalatKirim(
        e.status === 503
          ? "Penilaian sedang tidak tersedia. Jawabanmu belum dinilai, coba periksa lagi."
          : e.message
      );
    } finally {
      setMengirim(false);
    }
  }

  const skor = hasil ? Math.max(0, Math.min(100, Math.round(hasil.skor))) : 0;

  // Perhitungan statistik rangkuman
  const totalDikerjakan = riwayat.length;
  const jumlahBenar = riwayat.filter((item) => item.benar).length;
  const rataRataSkor =
    totalDikerjakan > 0
      ? Math.round(riwayat.reduce((total, item) => total + item.skor, 0) / totalDikerjakan)
      : 0;

  const tampilkanFooter =
    selesai || (mulai && !galatSoal && Boolean(soal) && terjawab);

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <Navbar
        onLogoClick={() => setIsSidebarOpen(true)}
        disableLogo={mulai && !selesai} 
      />

      <main
        className={`flex flex-col flex-grow w-11/12 sm:w-4/5 max-w-4xl mx-auto ${
          tampilkanFooter ? "pb-2" : "pb-8"
        }`}
      >
        {!mulai ? (
          /* Halaman Awal */
          <section
            className="flex flex-col items-center justify-center flex-grow rounded-3xl bg-white/40 backdrop-blur-sm px-6 py-10 md:px-12 text-center"
            data-testid="halaman-awal-kosakata"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/70 border border-gray-300/60 shadow-sm flex items-center justify-center text-custom2 mb-5">
              <FaSpellCheck className="text-3xl md:text-4xl" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-custom2">
              Belajar Kosakata
            </h1>
            <p className="mt-3 max-w-lg text-sm md:text-base text-gray-700 leading-relaxed">
              Latih kemampuan kosakata Bahasa Batak Toba dengan menyusun huruf acak menjadi kata yang tepat.
            </p>

            <div className="mt-6 w-full max-w-md rounded-2xl bg-white/60 border border-gray-300/60 p-5 text-left text-sm text-gray-700 space-y-2">
              <p className="font-semibold text-custom2">Cara Bermain:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Perhatikan arti kata dalam Bahasa Indonesia yang muncul.</li>
                <li>Klik huruf atau ketik lewat papan ketik untuk mengisi kotak jawaban.</li>
                <li>Tekan <strong>Periksa</strong> untuk melihat skor kemiripan jawabanmu.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleMulai}
              data-testid="tombol-mulai"
              className="mt-8 inline-flex items-center gap-2.5 px-8 py-2.5 rounded-full text-base font-bold text-white bg-gradient-to-b from-custom1 to-custom2 hover:opacity-85 shadow-md transition cursor-pointer"
            >
              <FaPlay className="text-xs" />
              Mulai
            </button>
          </section>
        ) : selesai ? (
          /* Halaman Rangkuman */
          <section
            className="flex flex-col flex-grow rounded-3xl bg-white/40 backdrop-blur-sm px-5 py-8 md:px-10"
            data-testid="halaman-rangkuman-kosakata"
          >
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-custom2">
                Rangkuman Latihan Kosakata
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                Berikut hasil kosakata yang baru saja kamu kerjakan
              </p>
            </div>

            {/* Ringkasan */}
            <div className="mt-6 grid grid-cols-3 gap-3 md:gap-5">
              <div className="rounded-2xl bg-white/70 border border-gray-300/60 p-3 md:p-4 text-center shadow-sm">
                <p className="text-xs md:text-sm text-gray-600">Total Kata</p>
                <p className="mt-1 text-xl md:text-2xl font-bold text-custom2" data-testid="total-kata">
                  {totalDikerjakan}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 border border-gray-300/60 p-3 md:p-4 text-center shadow-sm">
                <p className="text-xs md:text-sm text-gray-600">Jawaban Benar</p>
                <p className="mt-1 text-xl md:text-2xl font-bold text-custom1" data-testid="jumlah-benar">
                  {jumlahBenar} / {totalDikerjakan}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 border border-gray-300/60 p-3 md:p-4 text-center shadow-sm">
                <p className="text-xs md:text-sm text-gray-600">Rata-rata Skor</p>
                <p className="mt-1 text-xl md:text-2xl font-bold text-custom2" data-testid="rata-rata-skor">
                  {rataRataSkor}
                </p>
              </div>
            </div>

            {/* Rincian Jawaban */}
            <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-1" data-testid="daftar-rangkuman">
              {riwayat.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white/75 border border-gray-300/60 px-4 py-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-custom2 text-white text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{item.kataIndonesia}</p>
                      <p className="text-xs sm:text-sm text-gray-700 mt-0.5">
                        Jawabanmu:{" "}
                        <span
                          className={`font-semibold uppercase ${
                            item.benar ? "text-custom1" : "text-red-600"
                          }`}
                        >
                          {item.jawabanUser}
                        </span>
                        {!item.benar && (
                          <span className="ml-2 text-gray-600">
                            - Benar: <strong className="text-custom2 uppercase">{item.kataBenar}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#5E9B8B]/20 text-custom2">
                      Skor: {item.skor}
                    </span>
                    {item.benar ? (
                      <FaCheckCircle className="text-custom1 text-lg shrink-0" aria-label="Benar" />
                    ) : (
                      <FaTimesCircle className="text-red-500 text-lg shrink-0" aria-label="Belum tepat" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center flex-grow rounded-3xl bg-white/40 backdrop-blur-sm px-4 py-8 md:px-10">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-custom2 bg-white/60 px-3 py-1 rounded-full">
                Dikerjakan: {totalDikerjakan}
              </span>
              <h1 className="text-lg md:text-xl font-bold text-custom2">Belajar Kosakata</h1>
              {totalDikerjakan > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelesai(true)}
                  data-testid="tombol-rangkuman-atas"
                  className="text-xs sm:text-sm font-semibold text-custom1 hover:underline cursor-pointer"
                >
                  Lihat Rangkuman
                </button>
              ) : (
                <span className="w-20" />
              )}
            </div>

            {memuat ? (
              <p className="mt-16 text-custom2" data-testid="memuat">Memuat soal...</p>
            ) : galatSoal ? (
              <div className="mt-12 text-center text-custom2" role="alert">
                <p>{galatSoal}</p>
                <button type="button" onClick={muatSoal} className="button-custom mt-4 px-6 py-2">
                  Coba lagi
                </button>
              </div>
            ) : soal ? (
              <>
                <p className="mt-8 text-lg md:text-xl font-bold text-gray-900 text-center" data-testid="kata-indonesia">
                  {soal.kataIndonesia}
                </p>

                {/* Kotak jawaban */}
                <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-5" data-testid="kotak-jawaban">
                  {slots.map((nomor, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={terjawab || nomor === null}
                      onClick={() => kosongkan(i)}
                      aria-label={
                        nomor === null
                          ? `Kotak ${i + 1} kosong`
                          : `Kotak ${i + 1}: ${soal.hurufAcak[nomor]}. Klik untuk melepas`
                      }
                      data-testid="kotak"
                      data-isi={nomor === null ? "" : soal.hurufAcak[nomor]}
                      className="flex items-end justify-center w-12 h-14 md:w-14 md:h-16 border-b-2 border-gray-500/70"
                    >
                      {nomor !== null && (
                        <span className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 mb-1 rounded-xl bg-custom2 text-white text-xl font-bold shadow">
                          {soal.hurufAcak[nomor].toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Pilihan huruf */}
                <div className="mt-12 flex flex-wrap justify-center gap-3 md:gap-5" data-testid="pilihan-huruf">
                  {soal.hurufAcak.map((h, n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={terpakai.has(n) || terjawab}
                      onClick={() => isi(n)}
                      data-testid="abjad"
                      data-terpakai={terpakai.has(n) ? "ya" : "tidak"}
                      className={`flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl bg-custom2 text-white text-xl font-bold shadow transition ${
                        terpakai.has(n) ? "opacity-25" : "hover:opacity-80"
                      }`}
                    >
                      {h.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Skor kemiripan (fuzzy match) & Button Periksa */}
                <div className="mt-auto pt-12 w-full max-w-2xl flex items-center gap-3">
                  <div className="relative flex-1 h-10 rounded-lg bg-[#5E9B8B]/40 overflow-hidden" data-testid="bar-skor">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#5E9B8B] transition-all duration-500"
                      style={{ width: `${terjawab ? skor : 100}%` }}
                    />
                    <span className="relative flex items-center justify-center h-full text-sm font-semibold text-white px-2 text-center">
                      Skor kemiripan
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center w-16 h-10 shrink-0 rounded-lg border border-gray-400/60 bg-white/60 font-bold text-custom2"
                    data-testid="nilai-skor"
                  >
                    {terjawab ? skor : ""}
                  </div>
                  <button
                    type="button"
                    onClick={periksa}
                    disabled={!penuh || mengirim || terjawab}
                    data-testid={!terjawab ? "tombol-aksi" : "tombol-periksa"}
                    className="h-10 px-6 sm:px-7 shrink-0 rounded-full text-sm font-bold text-white bg-gradient-to-b from-custom1 to-custom2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    {mengirim ? "Memeriksa..." : "Periksa"}
                  </button>
                </div>

                <div className="mt-3 min-h-12 text-center text-sm" aria-live="polite">
                  {terjawab && (
                    <p className={hasil.benar ? "text-custom1 font-semibold" : "text-custom2"} data-testid="umpan-balik">
                      {hasil.benar ? "Benar! " : "Belum tepat. "}
                      Kata yang benar: <strong>{hasil.kataBenar}</strong>
                      {hasil.tersimpan === false && " (skor tidak tersimpan)"}
                    </p>
                  )}
                  {galatKirim && (
                    <p className="text-custom4" role="alert" data-testid="galat-kirim">
                      {galatKirim}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </section>
        )}
      </main>

      {/* Navigasi Bawah  */}
      {tampilkanFooter && (
        <footer className="flex items-center justify-end w-full px-6 py-6 md:px-12 mt-auto">
          {selesai ? (
            <button
              type="button"
              onClick={handleMulai}
              data-testid="tombol-latih-lagi"
              className="inline-flex items-center gap-2.5 px-7 py-2.5 rounded-full text-sm sm:text-base font-bold text-white bg-gradient-to-b from-custom1 to-custom2 hover:opacity-80 shadow-md transition cursor-pointer"
            >
              <FaRedo className="text-xs sm:text-sm" />
              Latih Lagi
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={muatSoal}
                disabled={memuat}
                data-testid="tombol-aksi"
                className="px-7 py-2.5 rounded-full text-sm sm:text-base font-bold text-white bg-gradient-to-b from-custom1 to-custom2 hover:opacity-80 disabled:opacity-50 shadow-md transition cursor-pointer"
              >
                Selanjutnya
              </button>
              <button
                type="button"
                onClick={() => setSelesai(true)}
                data-testid="tombol-selesai"
                className="px-7 py-2.5 rounded-full text-sm sm:text-base font-bold text-custom2 border border-custom2 bg-white/70 hover:bg-white shadow-sm transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}