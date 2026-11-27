import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaLock, FaUser } from "react-icons/fa";
import {
  ambilDaftarLiterasi,
  ambilDetailLiterasi,
  ambilUsername,
  tandaiSelesai,
} from "../service/literasiBudaya";

const KARTU_PER_HALAMAN = 2;

// Isi konten dipisah per paragraf (baris kosong), lalu dikelompokkan 2 kartu per halaman.
function bagiHalaman(isi) {
  const paragraf = String(isi || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const halaman = [];
  for (let i = 0; i < paragraf.length; i += KARTU_PER_HALAMAN) {
    halaman.push(paragraf.slice(i, i + KARTU_PER_HALAMAN));
  }
  return halaman;
}

function Header({ username }) {
  return (
    <nav className="flex items-center justify-between w-full px-6 py-8 md:px-12 md:py-10">
      <Link to="/dashboard-batak" className="logo font-irish m-0 text-2xl hover:opacity-80 transition">
        dialek.id
      </Link>
      <div className="flex items-center font-semibold text-custom2">
        <span className="px-3 md:px-4 text-base md:text-xl" data-testid="username">
          {username || "Pengguna"}
        </span>
        <FaUser className="text-xl md:text-2xl" />
      </div>
    </nav>
  );
}

function Pesan({ teks, aksi, labelAksi }) {
  return (
    <div className="mt-10 p-6 rounded-3xl bg-white/50 backdrop-blur-sm text-center text-custom2" role="alert">
      <p>{teks}</p>
      {aksi && (
        <button type="button" onClick={aksi} className="button-custom mt-4 px-6 py-2">
          {labelAksi}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Peta level (roadmap)
function PetaLevel({ daftar, levelBudaya, catatan, onBuka }) {
  const jumlahSelesai = daftar.filter((k) => k.selesai).length;

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-center text-custom1">Literasi Budaya</h1>
      <p className="mt-2 text-center text-custom2" data-testid="ringkasan">
        {jumlahSelesai} dari {daftar.length} level selesai
        {levelBudaya ? <> · Level budaya: <strong>{levelBudaya}</strong></> : null}
      </p>
      {catatan && (
        <p className="mt-3 px-4 py-2 rounded-full bg-custom9 text-custom2 text-sm" data-testid="catatan">
          {catatan}
        </p>
      )}

      <ol className="w-full max-w-md mt-8 space-y-5">
        {daftar.map((k, i) => {
          const terbuka = i === 0 || k.selesai || daftar[i - 1].selesai;
          const kanan = i % 2 === 1;
          const bulat = k.selesai
            ? "bg-custom1 text-white"
            : terbuka
            ? "bg-white text-custom2 border-4 border-custom1"
            : "bg-gray-200 text-gray-500";
          return (
            <li key={k.kontenId} className={`flex ${kanan ? "justify-end" : "justify-start"}`}>
              <button
                type="button"
                disabled={!terbuka}
                onClick={() => onBuka(k.kontenId)}
                data-testid="level"
                data-status={k.selesai ? "selesai" : terbuka ? "terbuka" : "terkunci"}
                aria-label={`Level ${k.urutan}: ${k.judul}${terbuka ? "" : " (terkunci)"}`}
                className={`flex items-center gap-3 max-w-[85%] text-left ${kanan ? "flex-row-reverse text-right" : ""} ${
                  terbuka ? "hover:opacity-80" : "cursor-not-allowed opacity-70"
                } transition`}
              >
                <span className={`flex items-center justify-center shrink-0 w-14 h-14 rounded-full text-xl font-bold shadow ${bulat}`}>
                  {k.selesai ? <FaCheck /> : terbuka ? k.urutan : <FaLock />}
                </span>
                <span>
                  <span className="block font-semibold text-custom2 leading-snug">{k.judul}</span>
                  <span className="block text-xs text-custom2/70">{k.kategori}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// ---------------------------------------------------------------- Tampilan baca per level
function BacaLevel({ kontenId, onKembali, onSelesai, onGalatSesi }) {
  const [detail, setDetail] = useState(null);
  const [galat, setGalat] = useState("");
  const [halaman, setHalaman] = useState(0);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState("");

  useEffect(() => {
    let batal = false;
    setDetail(null);
    setGalat("");
    setHalaman(0);
    ambilDetailLiterasi(kontenId)
      .then((d) => !batal && setDetail(d))
      .catch((e) => {
        if (batal) return;
        if (e.status === 401) return onGalatSesi();
        setGalat(e.status === 404 ? "Konten Literasi Budaya tidak ditemukan." : e.message);
      });
    return () => {
      batal = true;
    };
  }, [kontenId, onGalatSesi]);

  const daftarHalaman = useMemo(() => (detail ? bagiHalaman(detail.isi) : []), [detail]);
  const terakhir = daftarHalaman.length > 0 && halaman === daftarHalaman.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [halaman]);

  async function selesai() {
    setMenyimpan(true);
    setGalatSimpan("");
    try {
      const hasil = await tandaiSelesai(kontenId);
      onSelesai(hasil);
    } catch (e) {
      if (e.status === 401) return onGalatSesi();
      setGalatSimpan(e.message);
      setMenyimpan(false);
    }
  }

  if (galat) return <Pesan teks={galat} aksi={onKembali} labelAksi="Kembali ke peta level" />;
  if (!detail) return <p className="mt-10 text-custom2" data-testid="memuat">Memuat konten...</p>;

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-2xl md:text-4xl font-bold text-center text-custom1" data-testid="judul-level">
        Level {detail.urutan}: {detail.judul}
      </h1>

      {detail.gambarUrl && (
        <img src={detail.gambarUrl} alt={detail.judul} className="mt-6 w-full max-h-72 object-cover rounded-3xl" />
      )}

      <div className="w-full mt-8 space-y-6" data-testid="halaman-baca">
        {daftarHalaman[halaman]?.map((p, i) => (
          <article
            key={`${halaman}-${i}`}
            data-testid="kartu"
            className="p-5 md:p-6 rounded-3xl bg-[#C9E3D9]/80 border border-[#5E9B8B]/60 shadow-sm text-justify text-sm md:text-base text-gray-800 leading-relaxed"
          >
            {p}
          </article>
        ))}
      </div>

      {terakhir && detail.sumber && (
        <p className="mt-4 text-xs italic text-custom2/70 text-center" data-testid="sumber">
          Sumber: {detail.sumber}
        </p>
      )}

      {galatSimpan && (
        <p className="mt-4 text-sm text-custom4" role="alert" data-testid="galat-simpan">
          {galatSimpan}
        </p>
      )}

      <div className="w-full mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (halaman === 0 ? onKembali() : setHalaman(halaman - 1))}
          className="px-5 py-2 rounded-full border border-custom1 text-custom1 font-semibold hover:bg-white/60 transition"
          data-testid="tombol-kembali"
        >
          {halaman === 0 ? "Peta level" : "Sebelumnya"}
        </button>

        <span className="text-xs text-custom2/70" data-testid="indikator">
          {halaman + 1} / {Math.max(daftarHalaman.length, 1)}
        </span>

        {terakhir || daftarHalaman.length === 0 ? (
          <button
            type="button"
            onClick={selesai}
            disabled={menyimpan}
            className="px-8 py-2 rounded-2xl text-white font-bold shadow-lg bg-gradient-to-b from-custom1 to-custom2 hover:opacity-90 disabled:opacity-60 transition"
            data-testid="tombol-selesai"
          >
            {menyimpan ? "Menyimpan..." : "Selesai"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setHalaman(halaman + 1)}
            className="px-8 py-2 rounded-2xl text-white font-bold shadow-lg bg-gradient-to-b from-custom1 to-custom2 hover:opacity-90 transition"
            data-testid="tombol-lanjut"
          >
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Halaman utama
export default function LiterasiBudaya() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [levelBudaya, setLevelBudaya] = useState("");
  const [catatan, setCatatan] = useState("");
  const [terpilih, setTerpilih] = useState(null);

  const keLogin = useCallback(() => navigate("/auth/login", { replace: true }), [navigate]);

  const muatDaftar = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setDaftar(await ambilDaftarLiterasi());
    } catch (e) {
      if (e.status === 401) return keLogin();
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [keLogin]);

  useEffect(() => {
    muatDaftar();
    ambilUsername().then((u) => u && setUsername(u));
  }, [muatDaftar]);

  async function setelahSelesai(hasil) {
    setLevelBudaya(hasil.levelBudaya);
    setCatatan(hasil.baru ? `Level selesai! Level budayamu sekarang ${hasil.levelBudaya}.` : "Level ini sudah pernah kamu selesaikan.");
    setTerpilih(null);
    await muatDaftar();
  }

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen">
      <Header username={username} />
      <main className="flex flex-col items-center flex-grow w-11/12 sm:w-4/5 max-w-3xl mx-auto pb-12">
        {terpilih ? (
          <BacaLevel
            kontenId={terpilih}
            onKembali={() => setTerpilih(null)}
            onSelesai={setelahSelesai}
            onGalatSesi={keLogin}
          />
        ) : memuat ? (
          <p className="mt-10 text-custom2" data-testid="memuat">Memuat peta level...</p>
        ) : galat ? (
          <Pesan teks={galat} aksi={muatDaftar} labelAksi="Coba lagi" />
        ) : daftar.length === 0 ? (
          <Pesan teks="Belum ada konten Literasi Budaya." />
        ) : (
          <>
            <div className="self-start">
              <button
                type="button"
                onClick={() => navigate("/dashboard-batak")}
                aria-label="Kembali ke dasbor"
                title="Kembali ke dasbor"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-custom1 text-white hover:opacity-80 transition"
              >
                <FaArrowLeft />
              </button>
            </div>
            <PetaLevel daftar={daftar} levelBudaya={levelBudaya} catatan={catatan} onBuka={(id) => { setCatatan(""); setTerpilih(id); }} />
          </>
        )}
      </main>
    </div>
  );
}
