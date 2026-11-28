import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilDaftarTopik, buatTopik } from "../service/forum";

export default function ForumDiskusi() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [topikList, setTopikList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState("");

  const [pertanyaanInput, setPertanyaanInput] = useState("");
  const [galatInput, setGalatInput] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);

  useEffect(() => {
    let aktif = true;

    setLoading(true);
    setErrorMuat("");
    ambilDaftarTopik()
      .then((data) => {
        if (!aktif) return;
        setTopikList(data.topik || []);
      })
      .catch((err) => {
        if (!aktif) return;
        if (err.status === 401) {
          navigate("/auth/login");
          return;
        }
        setErrorMuat(err.message || "Gagal memuat daftar diskusi.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, [navigate]);

  const handleTanya = async (e) => {
    e.preventDefault();
    const teks = pertanyaanInput.trim();
    if (!teks) {
      setGalatInput("Tolong masukkan pertanyaan terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    setGalatInput("");

    try {
      const topikBaru = await buatTopik(teks, teks);
      setTopikList((prev) => [topikBaru, ...prev]);
      setPertanyaanInput("");
    } catch (err) {
      if (err.status === 401) {
        navigate("/auth/login");
        return;
      }
      setGalatInput(err.message || "Gagal mengirim pertanyaan.");
    } finally {
      setSedangKirim(false);
    }
  };

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
            disabled={sedangKirim}
          />

          {galatInput && (
            <p className="mt-2 text-xs sm:text-sm text-red-700 font-medium" role="alert">
              {galatInput}
            </p>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={sedangKirim}
              className="bg-green-800 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {sedangKirim ? "Mengirim..." : "Tanya"}
            </button>
          </div>
        </form>

        {/* Daftar Pertanyaan */}
        <section className="w-full mt-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-green-800">
              Pertanyaan Lain:
            </h2>
          </div>

          {loading ? (
            <p className="text-center text-sm text-custom2 py-6 bg-white/40 rounded-2xl">
              Memuat diskusi...
            </p>
          ) : errorMuat ? (
            <p className="text-center text-sm text-red-700 py-6 bg-white/40 rounded-2xl">
              {errorMuat}
            </p>
          ) : (
            <div className="space-y-3">
              {topikList.length === 0 ? (
                <p className="text-center text-sm text-custom2 py-6 bg-white/40 rounded-2xl">
                  Belum ada pertanyaan. Jadilah yang pertama bertanya!
                </p>
              ) : (
                topikList.map((item) => (
                  <div
                    key={item.topikId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl shadow-md bg-[#4C968B] text-white"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-custom9 text-custom2 font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {(item.penulis?.nama || item.penulis?.username || "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white/95">
                          {item.penulis?.nama || item.penulis?.username || "Pengguna"}
                        </span>
                        <p className="text-sm sm:text-base mt-0.5 break-words">
                          {item.judul}
                        </p>
                        <span className="inline-block text-xs text-white/75 mt-1">
                          {item.jumlahBalasan || 0} jawaban
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/forum-diskusi/jawab?id=${encodeURIComponent(item.topikId)}`
                          )
                        }
                        className="bg-green-800 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-4 rounded-full shadow transition cursor-pointer"
                      >
                        Jawab
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
