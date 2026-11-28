import { useEffect, useRef, useState } from "react";
import {
  FaInfoCircle,
  FaTrophy,
  FaFlagCheckered,
} from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import {
  mulaiPermainan,
  kirimJawaban,
  akhiriPermainan,
  ambilLeaderboard,
} from "../service/permainan";

const DURASI_BAWAAN_DETIK = 60;

const ALASAN_SELESAI = {
  tidak_sesuai_aturan_sambung: (sesi) =>
    `Kata harus diawali huruf "${(sesi.hurufBerikutnya || "").toUpperCase()}".`,
  sudah_dipakai: () => "Kata itu sudah dipakai di permainan ini.",
  tidak_ada_di_kosakata: () => "Kata itu tidak ada di kosakata Batak Toba kami.",
  sistem_kehabisan_kata: () => "Hebat! Dia kehabisan kata untuk menyambung.",
  dihentikan_pemain: () => "Kamu mengakhiri permainan.",
  waktu_habis: () => "Waktu habis!",
};

function formatWaktu(detik) {
  const m = String(Math.floor(detik / 60)).padStart(2, "0");
  const s = String(detik % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function formatTanggal(tanggal) {
  if (!tanggal) return "";
  const d = new Date(`${tanggal}T00:00:00`);
  if (Number.isNaN(d.getTime())) return tanggal;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function DaftarKata({ kata, kosongTeks }) {
  const akhir = useRef(null);

  useEffect(() => {
    akhir.current?.scrollIntoView({ block: "nearest" });
  }, [kata.length]);

  return (
    <div
      className="mt-4 text-sm min-h-7 max-h-72 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-custom2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full"
      aria-live="polite"
    >
      {kata.length === 0 && <p className="text-gray-500">{kosongTeks}</p>}
      {kata.map((k, i) => (
        <div
          key={`${k}-${i}`}
          className="mb-1 px-2 py-1.5 rounded-lg bg-[#5E9B8B] text-white font-medium"
        >
          {k}
        </div>
      ))}
      <div ref={akhir} />
    </div>
  );
}

function PanelPeringkat({ status, data }) {
  const daftar = data?.peringkat || [];
  const saya = data?.saya || null;

  return (
    <div className="bg-white/30 backdrop-blur-sm rounded-2xl shadow-lg p-4">
      <h2 className="text-2xl font-extrabold text-center text-gradient font-poppins">
        Peringkat Harian
      </h2>
      {data?.tanggal && (
        <p className="text-center text-xs text-gray-600">{formatTanggal(data.tanggal)}</p>
      )}

      {status === "memuat" && (
        <p className="mt-4 text-center text-custom2">Memuat peringkat...</p>
      )}
      {status === "galat" && (
        <p className="mt-4 text-center text-red-600 font-semibold">
          Peringkat belum dapat dimuat.
        </p>
      )}
      {status === "ok" && daftar.length === 0 && (
        <p className="mt-4 text-center text-custom2 font-semibold">
          Belum ada data peringkat hari ini. Jadilah yang pertama bermain!
        </p>
      )}
      {status === "ok" && daftar.length > 0 && (
        <ol className="mt-4 space-y-2">
          {daftar.map((p) => (
            <li
              key={p.uid}
              data-testid="baris-peringkat"
              className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                saya && p.uid === saya.uid ? "bg-custom9" : ""
              }`}
            >
              <span className="w-6 font-semibold text-custom2">{p.peringkat}.</span>
              <span className="w-8 h-8 rounded-full bg-custom9 text-custom2 flex items-center justify-center font-bold">
                {(p.nama || "P").charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0 truncate font-semibold text-custom2">
                {p.nama || "Pemain"}
              </span>
              <span className="font-semibold text-custom2">{p.skorTertinggi}</span>
            </li>
          ))}
        </ol>
      )}
      {status === "ok" && saya && (
        <p className="mt-3 text-sm text-center text-custom2" data-testid="posisi-saya">
          Posisimu: #{saya.peringkat} dengan skor {saya.skorTertinggi}
        </p>
      )}
    </div>
  );
}

function PanelDistribusi({ status, data }) {
  const distribusi = data?.distribusi || [];
  const skorSaya = data?.saya?.skorTertinggi ?? null;
  const maks = Math.max(1, ...distribusi.map((d) => d.jumlah));
  const totalPemain = distribusi.reduce((jumlah, d) => jumlah + d.jumlah, 0);

  const rentangSaya = (d) =>
    skorSaya !== null && skorSaya >= d.batasBawah && (d.batasAtas === null || skorSaya <= d.batasAtas);

  return (
    <div className="bg-white/30 backdrop-blur-sm rounded-2xl shadow-lg p-4">
      <h2 className="text-2xl font-extrabold text-center text-gradient font-poppins">
        Distribusi Performa
      </h2>
      <p className="text-center text-xs text-gray-600">
        Jumlah pemain per rentang skor tertinggi hari ini
      </p>

      {status === "memuat" && (
        <p className="mt-4 text-center text-custom2">Memuat grafik...</p>
      )}
      {status === "galat" && (
        <p className="mt-4 text-center text-red-600 font-semibold">
          Grafik belum dapat dimuat.
        </p>
      )}
      {status === "ok" && (
        <>
          <div
            className="mt-4 flex items-end justify-between gap-2 h-40"
            role="img"
            aria-label={`Distribusi skor ${totalPemain} pemain hari ini: ${distribusi
              .map((d) => `${d.label} ada ${d.jumlah}`)
              .join(", ")}`}
          >
            {distribusi.map((d) => (
              <div
                key={d.label}
                data-testid="batang-distribusi"
                data-jumlah={d.jumlah}
                data-milik-saya={rentangSaya(d) ? "ya" : "tidak"}
                className="flex flex-col items-center justify-end flex-1 h-full"
              >
                <span className="text-xs font-semibold text-custom2 mb-1">{d.jumlah}</span>
                <div
                  className={`w-full rounded-t-md ${
                    rentangSaya(d) ? "bg-custom2" : "bg-custom1/50"
                  }`}
                  style={{ height: `${d.jumlah === 0 ? 2 : Math.max(6, (d.jumlah / maks) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between gap-2">
            {distribusi.map((d) => (
              <span key={d.label} className="flex-1 text-center text-[11px] text-gray-700">
                {d.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-center text-custom2">
            {skorSaya !== null ? (
              <>
                <span className="inline-block w-3 h-3 rounded-sm bg-custom2 align-middle mr-1" />
                Rentang skormu hari ini
              </>
            ) : (
              "Mainkan satu sesi untuk melihat posisimu di grafik."
            )}
          </p>
        </>
      )}
    </div>
  );
}

function PopupPetunjuk({ durasi, onTutup }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instruksi permainan"
    >
      <div className="p-6 rounded-2xl shadow-lg max-w-md w-full bg-custom9">
        <p className="text-lg font-bold mb-3 text-custom2">Instruksi Permainan</p>
        <ol className="text-left text-sm text-gray-900 space-y-2 list-decimal pl-5 mb-5">
          <li>Klik tombol "Mulai" untuk memulai permainan.</li>
          <li>Dia memberi kata awal. Kamu menyambungnya dengan kata Batak Toba.</li>
          <li>Kata barumu harus diawali huruf terakhir kata sebelumnya.</li>
          <li>Kata harus ada di kosakata Batak Toba dan belum pernah dipakai.</li>
          <li>Setiap kata yang benar menambah 10 poin untukmu, dan Dia juga mendapat 10 poin setiap menyambung.</li>
          <li>Kata yang salah mengakhiri permainan.</li>
          <li>Waktu bermain adalah {durasi} detik.</li>
          <li>Peringkat dihitung dari skor tertinggimu hari ini.</li>
        </ol>
        <div className="text-center">
          <button
            type="button"
            onClick={onTutup}
            className="bg-custom2 hover:opacity-80 text-white font-bold py-2 px-6 rounded"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Permainan() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // "siap" | "berjalan" | "selesai"
  const [tahap, setTahap] = useState("siap");
  const [sesi, setSesi] = useState(null);
  const [kataInput, setKataInput] = useState("");
  const [kataSalah, setKataSalah] = useState(null);
  const [rekorBaru, setRekorBaru] = useState(false);
  const [waktuHabis, setWaktuHabis] = useState(false);
  const [gagalSimpan, setGagalSimpan] = useState(false);
  const [pesanGalat, setPesanGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [akhiriGagal, setAkhiriGagal] = useState(false);
  const [petunjukTerbuka, setPetunjukTerbuka] = useState(false);

  const [durasi, setDurasi] = useState(DURASI_BAWAAN_DETIK);
  const [sisaDetik, setSisaDetik] = useState(DURASI_BAWAAN_DETIK);
  const batasWaktu = useRef(0);
  const kolomKata = useRef(null);

  const [statusPeringkat, setStatusPeringkat] = useState("memuat");
  const [peringkat, setPeringkat] = useState(null);

  const muatPeringkat = async () => {
    try {
      const data = await ambilLeaderboard(10, "harian");
      setPeringkat(data);
      setStatusPeringkat("ok");
    } catch {
      setStatusPeringkat("galat");
    }
  };

  useEffect(() => {
    muatPeringkat();
  }, []);

  // Hitung mundur berdasarkan batas waktu mutlak, supaya tetap akurat
  // saat tab browser dibatasi (throttle) di latar belakang.
  useEffect(() => {
    if (tahap !== "berjalan") return undefined;
    const id = setInterval(() => {
      const sisa = Math.max(0, Math.ceil((batasWaktu.current - Date.now()) / 1000));
      setSisaDetik(sisa);
    }, 250);
    return () => clearInterval(id);
  }, [tahap]);

  useEffect(() => {
    if (tahap === "berjalan" && !sibuk) kolomKata.current?.focus();
  }, [tahap, sibuk, sesi?.jumlahKata]);

  const tanganiGalatSesi = (err) => {
    // 404/409: sesi sudah tidak ada atau sudah berakhir (misalnya dibuka di tab lain).
    if (err.status === 404 || err.status === 409) {
      setSesi(null);
      setTahap("siap");
    }
    setPesanGalat(err.message);
  };

  const selesaikan = (data, opsi = {}) => {
    setSesi(data.sesi);
    setKataSalah(opsi.kataSalah ?? null);
    setWaktuHabis(Boolean(opsi.waktuHabis));
    setRekorBaru(data.rekorBaru);
    setGagalSimpan(false);
    setPesanGalat("");
    setTahap("selesai");
    muatPeringkat();
  };

  const mulai = async () => {
    setSibuk(true);
    setPesanGalat("");
    try {
      const data = await mulaiPermainan();
      const lama = data.durasiDetik || DURASI_BAWAAN_DETIK;
      setSesi(data);
      setKataInput("");
      setKataSalah(null);
      setRekorBaru(false);
      setWaktuHabis(false);
      setGagalSimpan(false);
      setAkhiriGagal(false);
      setDurasi(lama);
      batasWaktu.current = Date.now() + lama * 1000;
      setSisaDetik(lama);
      setTahap("berjalan");
    } catch (err) {
      setPesanGalat(err.message);
    } finally {
      setSibuk(false);
    }
  };

  const kirim = async (e) => {
    e.preventDefault();
    const kata = kataInput.trim();
    if (!kata || sibuk || !sesi || sisaDetik <= 0) return;

    setSibuk(true);
    setPesanGalat("");
    try {
      const data = await kirimJawaban(sesi.sesiId, kata);
      setKataInput("");
      if (data.sesi.status === "selesai") {
        const karenaWaktu = data.alasan === "waktu_habis";
        selesaikan(data, {
          kataSalah: data.valid || karenaWaktu ? null : kata,
          waktuHabis: karenaWaktu,
        });
      } else {
        setSesi(data.sesi);
      }
    } catch (err) {
      tanganiGalatSesi(err);
    } finally {
      setSibuk(false);
    }
  };

  const akhiri = async ({ karenaWaktu = false } = {}) => {
    if (!sesi || sibuk) return;
    setSibuk(true);
    setPesanGalat("");
    try {
      const data = await akhiriPermainan(sesi.sesiId);
      selesaikan(data, { waktuHabis: karenaWaktu });
    } catch (err) {
      if (err.status === 404 || err.status === 409) {
        tanganiGalatSesi(err);
      } else {
        // SRS UC-14 A2: skor gagal disimpan. Tampilkan pesan galat dan tetap tampilkan skor sesi.
        setAkhiriGagal(true);
        setWaktuHabis(karenaWaktu);
        setKataSalah(null);
        setRekorBaru(false);
        setGagalSimpan(true);
        setPesanGalat(err.message);
        setTahap("selesai");
      }
    } finally {
      setSibuk(false);
    }
  };

  // Waktu habis: akhiri sesi di server. Bila ada jawaban yang masih diproses,
  // tunggu sampai selesai dulu (sibuk). Bila gagal, tidak dicoba terus-menerus;
  // pemain dapat memakai tombol "Coba simpan lagi".
  useEffect(() => {
    if (tahap === "berjalan" && sisaDetik <= 0 && !sibuk && !akhiriGagal) {
      akhiri({ karenaWaktu: true });
    }
  });

  const huruf = (sesi?.hurufBerikutnya || "").toUpperCase();
  const kataTerpakai = sesi?.kataTerpakai || [];
  const kataPemain = kataTerpakai.filter((_, i) => i % 2 === 1);
  const kataDia = kataTerpakai.filter((_, i) => i % 2 === 0);
  const skorKamu = sesi?.skor ?? 0;
  const skorDia = sesi?.skorSistem ?? 0;

  const waktuTampil = tahap === "siap" ? durasi : sisaDetik;
  const waktuMerah = tahap === "berjalan" && sisaDetik <= 10;
  const inputAktif = tahap === "berjalan" && !sibuk && sisaDetik > 0;

  const teksAlasan =
    sesi && (waktuHabis ? "Waktu habis!" : (ALASAN_SELESAI[sesi.alasanSelesai] || (() => ""))(sesi));

  const sedangBermain = tahap === "berjalan";
  
  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={!sedangBermain && isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <Navbar
          onLogoClick={() => setIsSidebarOpen(true)}
          disableLogo={sedangBermain}
        />

      <main className="flex flex-col items-center flex-grow w-11/12 sm:w-4/5 max-w-4xl mx-auto pb-10">
        <div className="relative flex items-center justify-center w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient font-poppins text-center px-12">
            Sambung Kata
          </h1>
        </div>

        <div
          data-testid="timer"
          className={`text-5xl sm:text-6xl py-5 font-bold font-poppins ${
            waktuMerah ? "text-custom4" : "text-custom2"
          }`}
          role="timer"
          aria-label="Sisa waktu"
        >
          {formatWaktu(waktuTampil)}
        </div>

        {pesanGalat && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm text-center w-full max-w-xl"
          >
            {pesanGalat}
          </div>
        )}

        {tahap === "siap" && (
          <div className="flex items-center justify-center gap-3 mb-5">
            <button
              type="button"
              onClick={mulai}
              disabled={sibuk}
              className="button-custom px-10 py-3 font-poppins disabled:opacity-50"
            >
              {sibuk ? "Menyiapkan..." : "Mulai"}
            </button>
            <button
              type="button"
              onClick={() => setPetunjukTerbuka(true)}
              aria-label="Instruksi permainan"
              title="Instruksi permainan"
              className="text-custom2 hover:text-custom1 text-2xl"
            >
              <FaInfoCircle />
            </button>
          </div>
        )}

        {tahap === "berjalan" && (
          <button
            type="button"
            onClick={() => akhiri()}
            disabled={sibuk}
            className="mb-5 text-custom4 font-poppins font-medium hover:underline disabled:opacity-50"
          >
            Akhiri permainan
          </button>
        )}

        {tahap === "selesai" && sesi && (
          <div className="w-full max-w-xl mb-5 p-4 rounded-2xl shadow-lg bg-white/40 backdrop-blur-sm text-center">
            <FaFlagCheckered className="mx-auto text-3xl text-custom2 mb-1" />
            <h2 className="text-xl font-bold font-poppins text-custom2">Permainan Selesai</h2>
            <p className="text-gray-800 mt-1" data-testid="alasan">
              {teksAlasan}
            </p>
            {kataSalah && (
              <p className="text-sm text-gray-700 mt-1">
                Kata yang kamu kirim:{" "}
                <span className="font-semibold text-custom4">{kataSalah}</span>
              </p>
            )}
            {gagalSimpan && (
              <p
                data-testid="gagal-simpan"
                className="mt-2 text-sm text-red-700 font-semibold"
              >
                Skor gagal disimpan, tetapi skor sesi ini tetap ditampilkan.
              </p>
            )}
            {rekorBaru && (
              <p
                data-testid="rekor-baru"
                className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-full bg-custom9 text-custom2 font-poppins font-semibold"
              >
                <FaTrophy /> Skor tertinggi harianmu!
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              {gagalSimpan && (
                <button
                  type="button"
                  onClick={() => akhiri({ karenaWaktu: waktuHabis })}
                  disabled={sibuk}
                  className="px-6 py-3 rounded-full border border-custom1 text-custom1 font-poppins font-medium hover:bg-custom1 hover:text-white transition disabled:opacity-50"
                >
                  {sibuk ? "Menyimpan..." : "Coba simpan lagi"}
                </button>
              )}
              <button
                type="button"
                onClick={mulai}
                disabled={sibuk}
                className="button-custom px-8 py-3 font-poppins disabled:opacity-50"
              >
                {sibuk ? "Menyiapkan..." : "Main Lagi"}
              </button>
              <button
                type="button"
                onClick={() => setPetunjukTerbuka(true)}
                aria-label="Instruksi permainan"
                title="Instruksi permainan"
                className="text-custom2 hover:text-custom1 text-2xl"
              >
                <FaInfoCircle />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-[#5E9B8B]/50">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-xl text-custom2">Kamu</p>
              <div className="px-4 py-1 text-2xl font-bold text-custom2 bg-[#E3EAE8] rounded-full min-w-16 text-center">
                <span data-testid="skor">{skorKamu}</span>
              </div>
            </div>
            <form onSubmit={kirim} className="mt-3">
              <input
                ref={kolomKata}
                type="text"
                value={kataInput}
                onChange={(e) => setKataInput(e.target.value)}
                disabled={!inputAktif}
                maxLength={50}
                autoComplete="off"
                autoCapitalize="off"
                placeholder={huruf && tahap === "berjalan" ? `Kata berawalan "${huruf}"` : "Masukkan kata"}
                aria-label="Kata sambungan"
                className="w-full p-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-custom1 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </form>
            {tahap === "berjalan" && (
              <p className="mt-2 text-sm text-custom2">
                Sambung dengan huruf{" "}
                <span
                  data-testid="huruf-berikutnya"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-custom1 text-white font-bold"
                >
                  {huruf}
                </span>
              </p>
            )}
            <DaftarKata kata={kataPemain} kosongTeks="Belum ada kata darimu." />
          </div>

          <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-[#5E9B8B]/50">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-xl text-custom2">Dia</p>
              <div className="px-4 py-1 text-2xl font-bold text-custom2 bg-[#E3EAE8] rounded-full min-w-16 text-center">
                <span data-testid="skor-dia">{skorDia}</span>
              </div>
            </div>
            <input
              type="text"
              disabled
              placeholder="(Mardomu)"
              aria-label="Kolom giliran Dia"
              className="mt-3 w-full p-2 rounded-lg border border-gray-300 bg-white text-sm cursor-not-allowed"
            />
            <DaftarKata kata={kataDia} kosongTeks="Menunggu kata awal." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-6">
          <PanelPeringkat status={statusPeringkat} data={peringkat} />
          <PanelDistribusi status={statusPeringkat} data={peringkat} />
        </div>
      </main>

      {petunjukTerbuka && (
        <PopupPetunjuk durasi={durasi} onTutup={() => setPetunjukTerbuka(false)} />
      )}
    </div>
  );
}