import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCog } from "react-icons/fa";
import { ambilAkun, ambilRingkasanBelajar } from "../service/akun";

const AVATAR_BAWAAN = null;

function Avatar({ nama }) {
  if (AVATAR_BAWAAN) {
    return (
      <img
        src={AVATAR_BAWAAN}
        alt="Foto profil"
        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover shrink-0"
        data-testid="avatar"
      />
    );
  }
  const huruf = (nama || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#5E9B8B] text-white flex items-center justify-center text-4xl font-bold shrink-0"
      aria-label="Foto profil"
      data-testid="avatar"
    >
      {huruf}
    </div>
  );
}

function Header() {
  return (
    <nav className="flex items-center w-full px-6 pt-8 md:px-12 md:pt-10">
      <Link to="/dashboard-batak" className="logo font-irish m-0 text-2xl hover:opacity-80 transition">
        dialek.id
      </Link>
    </nav>
  );
}

function Kartu({ judul, children, testid }) {
  return (
    <section
      className="rounded-3xl border border-[#9EC3B3] bg-white/40 backdrop-blur-sm p-5 md:p-6"
      data-testid={testid}
    >
      {judul && <h2 className="text-lg md:text-xl font-semibold text-custom2 mb-3">{judul}</h2>}
      {children}
    </section>
  );
}

function Kotak({ label, nilai, testid }) {
  return (
    <div
      className="flex-1 min-w-[6.5rem] rounded-xl bg-[#5E9B8B] text-white px-3 py-2"
      data-testid={testid}
    >
      <p className="text-[11px] leading-tight opacity-90">{label}</p>
      <p className="text-base md:text-lg font-semibold leading-tight mt-1">{nilai}</p>
    </div>
  );
}

// Daftar pencapaian dihitung dari ringkasan belajar (GET /api/dashboard).
function hitungPencapaian(ringkasan) {
  if (!ringkasan) return [];
  const daftar = [];

  const latihan = Array.isArray(ringkasan.progresLatihan) ? ringkasan.progresLatihan : [];
  const materiSelesai = latihan.filter((m) => m.selesai).length;
  if (materiSelesai > 0) {
    daftar.push({ id: "materi", teks: `${materiSelesai} dari ${latihan.length} materi latihan selesai` });
  }

  const kataMinggu = ringkasan.kosakataMingguan?.jumlahKataMingguIni || 0;
  if (kataMinggu > 0) {
    daftar.push({ id: "kata", teks: `${kataMinggu} kata dilatih minggu ini` });
  }

  const game = ringkasan.peringkatSambungKata;
  if (game?.skorTertinggi) {
    daftar.push({
      id: "game",
      teks: `Sambung Kata: peringkat #${game.peringkat}, skor tertinggi ${game.skorTertinggi}`,
    });
  }

  return daftar;
}

export default function Profil() {
  const navigate = useNavigate();
  const [akun, setAkun] = useState(null);
  const [ringkasan, setRingkasan] = useState(null);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(true);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    const [hasilAkun, hasilRingkasan] = await Promise.allSettled([
      ambilAkun(),
      ambilRingkasanBelajar(),
    ]);

    if (hasilAkun.status === "rejected") {
      const e = hasilAkun.reason;
      if (e?.status === 401) {
        navigate("/auth/login", { replace: true });
        return;
      }
      setGalat(e?.message || "Gagal memuat profil.");
      setMemuat(false);
      return;
    }

    setAkun(hasilAkun.value);
    // Ringkasan belajar boleh gagal tanpa merusak halaman: kotak diisi tanda "-".
    setRingkasan(hasilRingkasan.status === "fulfilled" ? hasilRingkasan.value : null);
    setMemuat(false);
  }, [navigate]);

  useEffect(() => {
    muat();
  }, [muat]);

  const pencapaian = hitungPencapaian(ringkasan);

  return (
    <div className="min-h-screen bg-custom-radial font-poppins pb-16">
      <Header />

      <main className="w-full max-w-3xl mx-auto px-6 mt-6 flex flex-col gap-5">
        {memuat && (
          <p className="text-center text-custom2 mt-10" data-testid="memuat">
            Memuat profil...
          </p>
        )}

        {!memuat && galat && (
          <div className="mt-10 p-6 rounded-3xl bg-white/50 text-center text-custom2" role="alert" data-testid="galat-muat">
            <p>{galat}</p>
            <button type="button" onClick={muat} className="button-custom mt-4 px-6 py-2">
              Coba lagi
            </button>
          </div>
        )}

        {!memuat && akun && (
          <>
            <Kartu testid="kartu-profil">
              <div className="flex items-start gap-5">
                <Avatar nama={akun.nama || akun.username} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between w-full max-w-3xl mx-auto mt-2">
                    <h1 className="text-2xl md:text-3xl font-semibold text-black break-words" data-testid="nama">
                      {akun.nama}
                    </h1>
                    <Link
                      to="/profil/pengaturan"
                      aria-label="Pengaturan akun"
                      className="w-9 h-9 flex items-center justify-center text-custom1 text-2xl hover:opacity-80 transition"
                      data-testid="tombol-pengaturan"
                    >
                      <FaCog />
                    </Link> 
                  </div>                 
                  <p className="text-xs text-custom2 mt-1 break-all" data-testid="username">
                    {akun.username}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Kotak label="Total Exp" nilai={ringkasan?.exp?.expPoin ?? akun.expPoin ?? "-"} testid="kotak-exp" />
                    <Kotak
                      label="Level"
                      nilai={ringkasan?.levelBudaya?.nama || ringkasan?.levelBudaya || akun.levelBudaya || "-"}
                      testid="kotak-level"
                    />
                    {/* Backend belum mencatat durasi belajar, jadi sementara tampil "-". */}
                    <Kotak label="Durasi Belajar" nilai="-" testid="kotak-durasi" />
                  </div>
                </div>
              </div>
            </Kartu>

            <Kartu judul="Pencapaian" testid="kartu-pencapaian">
              {pencapaian.length === 0 ? (
                <p className="text-sm text-custom2/80 py-6 text-center" data-testid="pencapaian-kosong">
                  Belum ada pencapaian. Yuk mulai berlatih!
                </p>
              ) : (
                <ul className="flex flex-wrap gap-3" data-testid="daftar-pencapaian">
                  {pencapaian.map((p) => (
                    <li key={p.id} className="px-4 py-2 rounded-full bg-custom9 text-custom2 text-sm font-medium">
                      {p.teks}
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>

            <Kartu judul="Bahasa yang Dipelajari" testid="kartu-bahasa">
              <span className="inline-block px-5 py-2 rounded-xl bg-[#5E9B8B] text-white font-semibold">
                Bahasa Batak Toba
              </span>
            </Kartu>
          </>
        )}
      </main>
    </div>
  );
}