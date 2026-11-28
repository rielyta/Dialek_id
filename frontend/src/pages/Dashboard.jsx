import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import {
  FaRobot,
  FaBookOpen,
  FaGamepad,
  FaScroll,
  FaLanguage,
} from "react-icons/fa";
import { auth } from "../service/firebase";
import ForumDiskusi from "../assets/ForumDiskusi.webp";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function DashboardBatak() {
  const [namaPengguna, setNamaPengguna] = useState("memuat...");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progress, setProgress] = useState({
    kosakataMingguan: 0,
    levelBudaya: 0,
    peringkatSambungKata: 0,
    latihanSoal: 0,
    expPoin: 0,
    expTarget: 100,
    persenExp: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/auth/login", { replace: true });
        return;
      }

      setIsLoadingProgress(true);

      try {
        const token = await currentUser.getIdToken();
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [akunRes, dashboardRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/akun`, { headers }),
          fetch(`${API_BASE_URL}/api/dashboard`, { headers }),
        ]);

        if (akunRes.ok) {
          const akunJson = await akunRes.json();
          const akun = akunJson.data || {};
          setNamaPengguna(
            akun.nama ||
              currentUser.displayName ||
              akun.username ||
              currentUser.email?.split("@")[0] ||
              "Pengguna"
          );
        } else {
          setNamaPengguna(
            currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "Pengguna"
          );
        }

        if (dashboardRes.ok) {
          const dashJson = await dashboardRes.json();
          const data = dashJson.data || dashJson || {};

          // Kosa Kata Mingguan (%)
          let persenKosakata = 0;
          if (typeof data.kosakataMingguan === "number") {
            persenKosakata = data.kosakataMingguan;
          } else if (data.kosakataMingguan) {
            const {
              persentase,
              persen,
              skorRataRata,
              jumlahKataMingguIni,
              targetMingguan,
            } = data.kosakataMingguan;

            if (typeof persentase === "number") {
              persenKosakata = persentase;
            } else if (typeof persen === "number") {
              persenKosakata = persen;
            } else if (targetMingguan > 0) {
              persenKosakata = (jumlahKataMingguIni / targetMingguan) * 100;
            } else {
              persenKosakata = skorRataRata || 0;
            }
          }

          // Level Budaya (angka)
          const LEVEL_MAP = { pemula: 1, menengah: 2, mahir: 3 };
          let levelBudayaAngka = 0;
          if (typeof data.levelBudaya === "object" && data.levelBudaya !== null) {
            levelBudayaAngka = data.levelBudaya.angka ?? data.levelBudaya.level ?? 0;
          } else if (typeof data.levelBudaya === "string") {
            levelBudayaAngka = LEVEL_MAP[data.levelBudaya.toLowerCase()] || 0;
          } else {
            const raw = data.levelBudaya ?? data.level_budaya ?? 0;
            levelBudayaAngka = Number.isFinite(Number(raw)) ? Number(raw) : 0;
          }

          // Peringkat Game Sambung Kata (angka)
          const rawPeringkat =
            typeof data.peringkatSambungKata === "object" &&
            data.peringkatSambungKata !== null
              ? data.peringkatSambungKata.peringkat ??
                data.peringkatSambungKata.rank ??
                0
              : data.peringkatSambungKata ??
                data.peringkatGame ??
                data.peringkat ??
                0;
          const peringkatAngka = Number.isFinite(Number(rawPeringkat))
            ? Number(rawPeringkat)
            : 0;

          // Latihan Soal (%)
          let persenLatihan = 0;
          if (typeof data.latihanSoal === "number") {
            persenLatihan = data.latihanSoal;
          } else if (
            data.latihanSoal &&
            typeof data.latihanSoal.persentase === "number"
          ) {
            persenLatihan = data.latihanSoal.persentase;
          } else if (typeof data.persenLatihan === "number") {
            persenLatihan = data.persenLatihan;
          } else if (
            Array.isArray(data.progresLatihan) &&
            data.progresLatihan.length > 0
          ) {
            const selesai = data.progresLatihan.filter(
              (item) => item.selesai
            ).length;
            persenLatihan = (selesai / data.progresLatihan.length) * 100;
          }

          // EXP & Progress Bar EXP
          let expPoin = 0;
          let expTarget = 100;
          let persenExp = 0;

          if (typeof data.exp === "number") {
            expPoin = data.exp;
            expTarget = Math.max(100, (Math.floor(expPoin / 100) + 1) * 100);
            persenExp = ((expPoin % 100) / 100) * 100;
          } else if (data.exp && typeof data.exp === "object") {
            expPoin = Number(data.exp.expPoin ?? data.exp.poin ?? 0);
            expTarget = Number(
              data.exp.expLevelBerikutnya ?? data.exp.target ?? 100
            );
            persenExp =
              typeof data.exp.persenExp === "number"
                ? data.exp.persenExp
                : expTarget > 0
                ? (expPoin / expTarget) * 100
                : 0;
          }

          setProgress({
            kosakataMingguan: Math.min(100, Math.max(0, Math.round(persenKosakata))),
            levelBudaya: levelBudayaAngka,
            peringkatSambungKata: peringkatAngka,
            latihanSoal: Math.min(100, Math.max(0, Math.round(persenLatihan))),
            expPoin,
            expTarget,
            persenExp: Math.min(100, Math.max(0, Math.round(persenExp))),
          });
        }
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        setNamaPengguna(
          currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Pengguna"
        );
      } finally {
        setIsLoadingProgress(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <Navbar
        nama={namaPengguna}
        onLogoClick={() => setIsSidebarOpen(true)}
      />

      {/* Konten Utama */}
      <section className="main flex flex-col mx-auto w-11/12 max-w-6xl flex-grow pb-16">
        <header>
          <div
            id="hero"
            className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-between"
          >
            <div className="flex w-full lg:w-1/3 justify-center">
              <div className="flex flex-col items-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gradient font-poppins text-center mb-4">
                  Bahasa Batak Toba
                </h1>
                <Link to="/forum-diskusi">
                  <img
                    src={ForumDiskusi}
                    alt="Forum Diskusi"
                    className="w-64 sm:w-72 md:max-w-sm hover:scale-95 cursor-pointer transition duration-300 transform"
                  />
                </Link>
              </div>
            </div>

            {/* Progress Box */}
            <div className="w-full lg:w-2/3 bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg font-inter text-custom6 font-semibold p-6 md:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center items-center font-inter">
                {/* Kosa Kata Mingguan */}
                <div className="flex flex-col items-center">
                  <p className="text-base md:text-lg font-bold text-custom6 text-center flex items-center justify-center min-h-14">
                    Kosa Kata
                    <br />
                    Mingguan
                  </p>
                  <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-700 mt-3">
                    <p className="text-xl md:text-2xl font-bold text-custom4">
                      {isLoadingProgress ? "..." : `${progress.kosakataMingguan}%`}
                    </p>
                  </div>
                </div>

                {/* Level Budaya (Angka) */}
                <div className="flex flex-col items-center">
                  <p className="text-base md:text-lg font-bold text-custom6 text-center flex items-center justify-center min-h-14">
                    Level Budaya
                  </p>
                  <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-700 mt-3">
                    <p className="text-xl md:text-2xl font-bold text-custom2">
                      {isLoadingProgress ? "..." : progress.levelBudaya}
                    </p>
                  </div>
                </div>

                {/* Peringkat Game Sambung Kata */}
                <div className="flex flex-col items-center">
                  <p className="text-base md:text-lg font-bold text-custom6 text-center flex items-center justify-center min-h-14">
                    Peringkat Game
                    <br />
                    Sambung Kata
                  </p>
                  <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-700 mt-3">
                    <p className="text-xl md:text-2xl font-bold text-custom2">
                      {isLoadingProgress ? "..." : progress.peringkatSambungKata}
                    </p>
                  </div>
                </div>

                {/* Latihan Soal */}
                <div className="flex flex-col items-center">
                  <p className="text-base md:text-lg font-bold text-custom6 text-center flex items-center justify-center min-h-14">
                    Latihan Soal
                  </p>
                  <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-700 mt-3">
                    <p className="text-xl md:text-2xl font-bold text-custom2">
                      {isLoadingProgress ? "..." : `${progress.latihanSoal}%`}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-custom2 font-light mt-6">
                <span className="text-custom4">*</span>persentase berdasarkan
                target mingguan, masih dalam pengerjaan
              </p>
            </div>
          </div>
        </header>

        {/* EXP BAR */}
        <div className="mt-8">
          <div className="flex items-center justify-between max-w-6xl mx-auto px-1">
            <span className="text-green-800 font-bold">
              EXP {isLoadingProgress ? "..." : progress.expPoin}
            </span>
            <span className="text-xs sm:text-sm text-green-900 font-medium">
              {isLoadingProgress
                ? "Memuat progres..."
                : `${progress.expPoin} / ${progress.expTarget} EXP`}
            </span>
          </div>

          <div className="flex justify-center mt-2">
            <div className="max-w-6xl w-full">
              <div className="bg-slate-700 rounded-full h-6 w-full overflow-hidden">
                <div
                  id="loading-bar"
                  style={{ width: `${progress.persenExp}%` }}
                  className="bg-custom1 h-6 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-14 md:mt-20 mb-8">
          <h2 className="text-3xl font-bold text-gradient font-poppins text-center">
            Mulai Belajar
          </h2>
        </div>

        {/* MATERI */}
        <div className="box-custom1 p-6 mt-4 min-h-64 flex items-center">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full">
            <div className="w-full md:w-1/3 flex justify-center items-center">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-green-100 to-emerald-200/80 border-4 border-white/80 shadow-inner flex items-center justify-center text-green-900">
                <FaBookOpen className="text-6xl md:text-7xl" />
              </div>
            </div>

            <div className="w-full md:w-2/3 text-center md:text-left flex flex-col justify-center items-center md:items-start">
              <h3 className="text-2xl md:text-3xl font-medium text-green-900 mb-2">
                Materi
              </h3>
              <p className="text-gray-600 mb-4 max-w-xl">
                Mulai perjalananmu belajar Bahasa Batak dengan materi yang
                disesuaikan dengan kemampuanmu dan dapat diakses kapan saja!
              </p>
              <button
                type="button"
                onClick={() => navigate("/pilih-materi")}
                className="button-custom py-2 px-8 rounded-full hover:bg-lime-900 transition cursor-pointer"
              >
                Pelajari
              </button>
            </div>
          </div>
        </div>

        {/* PERMAINAN */}
        <div className="box-custom1 p-6 mt-6 min-h-64 flex items-center">
          <div className="flex flex-col-reverse md:flex-row items-center gap-6 w-full">
            <div className="w-full md:w-2/3 text-center md:text-right flex flex-col justify-center items-center md:items-end">
              <h3 className="text-2xl md:text-3xl font-medium text-green-900 mb-2">
                Permainan
              </h3>
              <p className="text-gray-600 mb-4 max-w-xl">
                Asah keterampilanmu dengan permainan sambung kata melawan
                pengguna lain. Kembangkan kemampuanmu dan perluas kosa katamu!
              </p>
              <button
                type="button"
                onClick={() => navigate("/permainan")}
                className="button-custom py-2 px-8 rounded-full hover:bg-lime-900 transition cursor-pointer"
              >
                Pelajari
              </button>
            </div>

            <div className="w-full md:w-1/3 flex justify-center items-center">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-green-100 to-emerald-200/80 border-4 border-white/80 shadow-inner flex items-center justify-center text-green-900">
                <FaGamepad className="text-6xl md:text-7xl" />
              </div>
            </div>
          </div>
        </div>

        {/* LITERASI BUDAYA */}
        <div className="box-custom1 p-6 mt-6 min-h-64 flex items-center">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full">
            <div className="w-full md:w-1/3 flex justify-center items-center">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-green-100 to-emerald-200/80 border-4 border-white/80 shadow-inner flex items-center justify-center text-green-900">
                <FaScroll className="text-6xl md:text-7xl" />
              </div>
            </div>

            <div className="w-full md:w-2/3 text-center md:text-left flex flex-col justify-center items-center md:items-start">
              <h3 className="text-2xl md:text-3xl font-medium text-green-900 mb-2">
                Literasi Budaya
              </h3>
              <p className="text-gray-600 mb-4 max-w-xl">
                Kenali budaya lebih dalam dengan cerita daerah dan latihan
                harian yang dapat membantumu merasa lebih dekat dengan budaya
                Batak!
              </p>
              <button
                type="button"
                onClick={() => navigate("/literasi-budaya")}
                className="button-custom py-2 px-8 rounded-full hover:bg-lime-900 transition cursor-pointer"
              >
                Pelajari
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT 4: KOSA KATA */}
        <div className="box-custom1 p-6 mt-6 min-h-64 flex items-center">
          <div className="flex flex-col-reverse md:flex-row items-center gap-6 w-full">
            <div className="w-full md:w-2/3 text-center md:text-right flex flex-col justify-center items-center md:items-end">
              <h3 className="text-2xl md:text-3xl font-medium text-green-900 mb-2">
                Kosa Kata
              </h3>
              <p className="text-gray-600 mb-4 max-w-xl">
                Perbanyak kosa katamu dengan latihan yang menantang dan dapatkan
                pengetahuan baru yang dapat digunakan sehari-hari!
              </p>
              <button
                type="button"
                onClick={() => navigate("/latihan-kosakata")}
                className="button-custom py-2 px-8 rounded-full hover:bg-lime-900 transition cursor-pointer"
              >
                Pelajari
              </button>
            </div>

            <div className="w-full md:w-1/3 flex justify-center items-center">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-green-100 to-emerald-200/80 border-4 border-white/80 shadow-inner flex items-center justify-center text-green-900">
                <FaLanguage className="text-6xl md:text-7xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Button */}
      <button
        type="button"
        onClick={() => navigate("/chatbot")}
        aria-label="Buka Chatbot"
        title="Tanya Chatbot Dialek.id"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-900 text-white shadow-xl flex items-center justify-center hover:bg-green-800 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer focus:outline-none"
      >
        <FaRobot className="text-2xl md:text-3xl" />
      </button>
    </div>
  );
}