import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilAkun } from "../service/akun";
import { auth } from "../service/firebase";

const STORAGE_KEY = "dialek_forum_diskusi";

const PERTANYAAN_AWAL = [
  {
    id: "q-1",
    author: "Rina Siregar",
    text: 'Apa perbedaan penggunaan kata "Hita" dan "Hami" dalam percakapan sehari-hari?',
    likes: 5,
    liked: false,
    timestamp: Date.now() - 3600 * 1000 * 5,
    answers: [
      {
        id: "a-1",
        author: "Budi Hutapea",
        text: '"Hita" dipakai untuk "kita" (orang yang diajak bicara ikut termasuk), sedangkan "Hami" untuk "kami" (lawan bicara tidak termasuk).',
        likes: 3,
        liked: false,
        comments: [],
      },
    ],
  },
  {
    id: "q-2",
    author: "Dimas Simanjuntak",
    text: 'Bagaimana cara menyapa orang yang lebih tua dengan sopan dalam Bahasa Batak Toba?',
    likes: 8,
    liked: false,
    timestamp: Date.now() - 3600 * 1000 * 2,
    answers: [],
  },
];

export default function ForumDiskusi() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [namaPengguna, setNamaPengguna] = useState("Pengguna");

  const [pertanyaanList, setPertanyaanList] = useState(() => {
    try {
      const tersimpan = localStorage.getItem(STORAGE_KEY);
      return tersimpan ? JSON.parse(tersimpan) : PERTANYAAN_AWAL;
    } catch {
      return PERTANYAAN_AWAL;
    }
  });

  const [pertanyaanInput, setPertanyaanInput] = useState("");
  const [galatInput, setGalatInput] = useState("");
  const [urutan, setUrutan] = useState("terbaru"); // "terbaru" | "popular"

  useEffect(() => {
    let aktif = true;
    ambilAkun()
      .then((akun) => {
        if (!aktif) return;
        setNamaPengguna(
          akun?.nama ||
            auth.currentUser?.displayName ||
            "Pengguna"
        );
      })
      .catch(() => {
        if (!aktif) return;
        setNamaPengguna(auth.currentUser?.displayName || "Pengguna");
      });

    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pertanyaanList));
    } catch {
      // Abaikan jika penyimpanan penuh
    }
  }, [pertanyaanList]);

  const handleTanya = (e) => {
    e.preventDefault();
    const teks = pertanyaanInput.trim();
    if (!teks) {
      setGalatInput("Tolong masukkan pertanyaan terlebih dahulu.");
      return;
    }

    const baru = {
      id: `q-${Date.now()}`,
      author: namaPengguna,
      text: teks,
      likes: 0,
      liked: false,
      timestamp: Date.now(),
      answers: [],
    };

    setPertanyaanList((prev) => [baru, ...prev]);
    setPertanyaanInput("");
    setGalatInput("");
    setUrutan("terbaru");
  };

  const toggleLike = (id) => {
    setPertanyaanList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const likedBaru = !item.liked;
        return {
          ...item,
          liked: likedBaru,
          likes: item.likes + (likedBaru ? 1 : -1),
        };
      })
    );
  };

  const daftarTerurut = useMemo(() => {
    const salinan = [...pertanyaanList];
    if (urutan === "popular") {
      return salinan.sort((a, b) => b.likes - a.likes);
    }
    return salinan.sort((a, b) => b.timestamp - a.timestamp);
  }, [pertanyaanList, urutan]);

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Navbar */}
      <Navbar onLogoClick={() => setIsSidebarOpen(true)} />

      {/* Konten Utama */}
      <main className="flex flex-col items-center flex-grow w-11/12 sm:w-4/5 max-w-3xl mx-auto pb-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient font-poppins">
            Wadah Diskusi
          </h1>
        </header>

        {/* Form Tulis Pertanyaan */}
        <form
          onSubmit={handleTanya}
          className="w-full p-5 md:p-6 rounded-3xl bg-[#D4E5DD]/60 backdrop-blur-sm border border-[#9EC3B3] shadow-md"
        >
          <div className="flex mb-4">
            <span className="button-custom inline-flex items-center justify-center text-xs sm:text-sm py-1.5 px-4 rounded-full">
              Bahasa Batak Toba
            </span>
          </div>

          <label
            htmlFor="pertanyaanInput"
            className="block text-base md:text-lg font-semibold text-green-800 mb-2"
          >
            Tulis pertanyaanmu:
          </label>
          <textarea
            id="pertanyaanInput"
            rows={4}
            value={pertanyaanInput}
            onChange={(e) => {
              setPertanyaanInput(e.target.value);
              if (galatInput) setGalatInput("");
            }}
            placeholder="Ajukan pertanyaan seputar Bahasa Batak Toba..."
            className="w-full p-3.5 rounded-2xl bg-[#4C968B] text-white placeholder-white/75 focus:outline-none focus:ring-2 focus:ring-custom1"
          />

          {galatInput && (
            <p className="mt-2 text-xs sm:text-sm text-red-700 font-medium" role="alert">
              {galatInput}
            </p>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              className="bg-green-800 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition cursor-pointer"
            >
              Tanya
            </button>
          </div>
        </form>

        {/* Daftar Pertanyaan Lain */}
        <section className="w-full mt-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-green-800">
              Pertanyaan Lain:
            </h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setUrutan("popular")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                  urutan === "popular"
                    ? "bg-green-800 text-white shadow"
                    : "bg-[#5E9B8B]/70 text-white hover:bg-[#5E9B8B]"
                }`}
              >
                Popular
              </button>
              <button
                type="button"
                onClick={() => setUrutan("terbaru")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                  urutan === "terbaru"
                    ? "bg-green-800 text-white shadow"
                    : "bg-[#5E9B8B]/70 text-white hover:bg-[#5E9B8B]"
                }`}
              >
                Terbaru
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {daftarTerurut.length === 0 ? (
              <p className="text-center text-sm text-custom2 py-6 bg-white/40 rounded-2xl">
                Belum ada pertanyaan. Jadilah yang pertama bertanya!
              </p>
            ) : (
              daftarTerurut.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl shadow-md bg-[#4C968B] text-white"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-custom9 text-custom2 font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {(item.author || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white/95">
                        {item.author}
                      </span>
                      <p className="text-sm sm:text-base mt-0.5 break-words">
                        {item.text}
                      </p>
                      <span className="inline-block text-xs text-white/75 mt-1">
                        {item.answers?.length || 0} jawaban
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/forum-diskusi/jawab?id=${encodeURIComponent(item.id)}`)
                      }
                      className="bg-green-800 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-4 rounded-full shadow transition cursor-pointer"
                    >
                      Jawab
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleLike(item.id)}
                      aria-label="Sukai pertanyaan"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/15 transition cursor-pointer"
                    >
                      <FaHeart
                        className={`text-base transition ${
                          item.liked ? "text-green-900" : "text-white"
                        }`}
                      />
                      <span className="text-sm font-semibold text-white">
                        {item.likes}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}