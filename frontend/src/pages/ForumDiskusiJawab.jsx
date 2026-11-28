import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaQuestionCircle, FaPaperPlane } from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilDetailTopik, balasTopik } from "../service/forum";

export default function ForumDiskusiJawab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topikId = searchParams.get("id");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [topik, setTopik] = useState(null);
  const [balasanList, setBalasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState("");

  const [answerInput, setAnswerInput] = useState("");
  const [galatJawaban, setGalatJawaban] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);

  useEffect(() => {
    if (!topikId) {
      setLoading(false);
      setErrorMuat("ID topik tidak ditemukan.");
      return;
    }

    let aktif = true;

    setLoading(true);
    setErrorMuat("");
    ambilDetailTopik(topikId)
      .then((data) => {
        if (!aktif) return;
        setTopik(data);
        setBalasanList(data.balasan || []);
      })
      .catch((err) => {
        if (!aktif) return;
        if (err.status === 401) {
          navigate("/auth/login");
          return;
        }
        setErrorMuat(err.message || "Gagal memuat topik.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, [topikId, navigate]);

  const handleKirimJawaban = async (e) => {
    e.preventDefault();
    const teks = answerInput.trim();
    if (!teks) {
      setGalatJawaban("Tolong masukkan jawaban terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    setGalatJawaban("");

    try {
      const balasanBaru = await balasTopik(topikId, teks);
      setBalasanList((prev) => [...prev, balasanBaru]);
      setAnswerInput("");
    } catch (err) {
      if (err.status === 401) {
        navigate("/auth/login");
        return;
      }
      setGalatJawaban(err.message || "Gagal mengirim jawaban.");
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

        <div className="w-full p-5 md:p-8 rounded-3xl bg-[#D4E5DD]/60 backdrop-blur-sm border border-[#9EC3B3] shadow-md">
          {loading ? (
            <p className="text-center text-sm text-custom2 py-6">
              Memuat topik...
            </p>
          ) : errorMuat ? (
            <p className="text-center text-sm text-red-700 py-6">
              {errorMuat}
            </p>
          ) : !topik ? (
            <p className="text-center text-sm text-custom2 py-6">
              Topik tidak ditemukan.
            </p>
          ) : (
            <>
              {/* Pertanyaan yang Ditampilkan */}
              <section className="mb-6 flex items-start gap-3">
                <FaQuestionCircle className="text-3xl text-green-800 shrink-0 mt-1" />
                <div className="flex-grow p-5 rounded-2xl bg-[#4C968B] text-white shadow">
                  <span className="block text-xs text-white/80 font-medium mb-1">
                    Ditanyakan oleh{" "}
                    {topik.penulis?.nama ||
                      topik.penulis?.username ||
                      "Pengguna"}
                  </span>
                  <p className="text-base md:text-lg font-medium">
                    {topik.judul}
                  </p>
                  {topik.isi && topik.isi !== topik.judul && (
                    <p className="text-sm mt-2 text-white/90">{topik.isi}</p>
                  )}
                </div>
              </section>

              {/* Form Input Jawaban */}
              <form onSubmit={handleKirimJawaban} className="mb-8">
                <div className="flex items-end gap-3">
                  <textarea
                    rows={4}
                    value={answerInput}
                    onChange={(e) => {
                      setAnswerInput(e.target.value);
                      if (galatJawaban) setGalatJawaban("");
                    }}
                    placeholder="Tulis jawabanmu di sini..."
                    className="w-full p-3.5 rounded-2xl bg-[#4C968B] text-white placeholder-white/75 focus:outline-none focus:ring-2 focus:ring-custom1"
                    disabled={sedangKirim}
                  />
                  <button
                    type="submit"
                    disabled={sedangKirim}
                    aria-label="Kirim jawaban"
                    title="Kirim Jawaban"
                    className="w-12 h-12 rounded-full bg-green-800 hover:bg-green-700 text-white flex items-center justify-center shadow-md shrink-0 transition cursor-pointer disabled:opacity-50"
                  >
                    <FaPaperPlane className="text-lg" />
                  </button>
                </div>
                {galatJawaban && (
                  <p
                    className="mt-2 text-xs sm:text-sm text-red-700 font-medium"
                    role="alert"
                  >
                    {galatJawaban}
                  </p>
                )}
              </form>

              {/* Daftar Jawaban */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-green-800">
                  Jawaban ({balasanList.length})
                </h2>

                {balasanList.length === 0 ? (
                  <p className="text-sm text-custom2 bg-white/50 rounded-2xl p-5 text-center">
                    Belum ada jawaban. Jadilah yang pertama membantu menjawab!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {balasanList.map((bal) => (
                      <div
                        key={bal.balasanId}
                        className="flex flex-col p-4 rounded-2xl bg-[#68A192] text-white shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-custom9 text-custom2 font-bold flex items-center justify-center shrink-0">
                            {(
                              bal.penulis?.nama ||
                              bal.penulis?.username ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="font-semibold text-sm text-white/95">
                              {bal.penulis?.nama ||
                                bal.penulis?.username ||
                                "Pengguna"}
                            </span>
                            <p className="text-sm sm:text-base mt-0.5 break-words">
                              {bal.isi}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between w-full px-4 py-6 mt-auto">
        <button
          type="button"
          onClick={() => navigate("/forum-diskusi")}
          className="button-custom2 border border-green-700 text-green-800 hover:bg-green-700 hover:text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
        >
          Kembali
        </button>
      </footer>
    </div>
  );
}
