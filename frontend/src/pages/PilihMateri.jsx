import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaBookOpen } from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilDaftarMateri } from "../service/materi";

export default function PilihMateri() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState("");

  useEffect(() => {
    let aktif = true;

    setLoading(true);
    setErrorMuat("");
    ambilDaftarMateri()
      .then((data) => {
        if (!aktif) return;

        // Kelompokkan materi berdasarkan kategori dari backend
        const map = {};
        (data || []).forEach((m) => {
          const kat = m.kategori || "lainnya";
          if (!map[kat]) {
            map[kat] = {
              id: kat,
              title: kat,
              count: 0,
              completedCount: 0,
              unlocked: true,
            };
          }

          map[kat].count += 1;

          // Hitung materi yang sudah selesai jika field status tersedia dari backend
          const isDone = Boolean(
            m.selesai ?? m.completed ?? m.is_completed ?? m.sudahSelesai
          );
          if (isDone) {
            map[kat].completedCount += 1;
          }

          if (typeof m.unlocked === "boolean") {
            map[kat].unlocked = m.unlocked;
          } else if (typeof m.terbuka === "boolean") {
            map[kat].unlocked = m.terbuka;
          }
        });

        // Hitung persentase progress & urutkan berdasarkan alfabet
        const sorted = Object.values(map)
          .map((item) => ({
            ...item,
            progress:
              item.count > 0
                ? Math.round((item.completedCount / item.count) * 100)
                : 0,
          }))
          .sort((a, b) => a.title.localeCompare(b.title, "id"));

        setTopics(sorted);
      })
      .catch((err) => {
        if (!aktif) return;
        if (err.status === 401) {
          navigate("/auth/login");
          return;
        }
        setErrorMuat(err.message || "Gagal memuat daftar materi.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, [navigate]);

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Navbar onLogoClick={() => setIsSidebarOpen(true)} />

      {/* Konten Utama */}
      <section className="main flex flex-col mx-auto w-11/12 md:w-4/5 max-w-5xl items-center flex-grow pb-12">
        <div className="flex justify-center items-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient font-poppins">
            Materi
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-sm text-custom2 py-6">
            Memuat daftar materi...
          </p>
        ) : errorMuat ? (
          <p className="text-center text-sm text-red-700 py-6">{errorMuat}</p>
        ) : topics.length === 0 ? (
          <p className="text-center text-sm text-custom2 py-6">
            Belum ada materi yang tersedia.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-10 w-full px-2 sm:px-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-4 px-5 py-6 md:px-6 rounded-2xl border border-gray-300 bg-white/40 backdrop-blur-sm shadow-md w-full"
              >
                {topic.unlocked ? (
                  <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 border-2 border-white shadow-inner flex items-center justify-center text-green-900">
                    <FaBookOpen className="text-2xl md:text-3xl" />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 flex items-center justify-center bg-gray-300 rounded-full">
                    <FaLock className="text-gray-500 text-xl md:text-2xl" />
                  </div>
                )}

                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <span className="text-lg md:text-xl font-semibold text-gray-700 truncate capitalize">
                    {topic.title}
                  </span>
                </div>

                {topic.unlocked ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/materi/${encodeURIComponent(topic.id)}`)
                    }
                    className="button-custom bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-full shrink-0 transition cursor-pointer"
                  >
                    Mulai
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="button-lock bg-gray-300 text-gray-500 font-medium px-5 py-2 rounded-full shrink-0 cursor-not-allowed"
                  >
                    Mulai
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between w-full px-4 py-6 mt-auto">
        <button
          type="button"
          onClick={() => navigate("/dashboard-batak")}
          className="button-custom2 border border-green-700 text-green-800 hover:bg-green-700 hover:text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
        >
          Kembali
        </button>
      </footer>
    </div>
  );
}