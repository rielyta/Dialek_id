import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaComment,
  FaHeart,
  FaPaperPlane,
  FaQuestionCircle,
} from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { ambilAkun } from "../service/akun";
import { auth } from "../service/firebase";

const STORAGE_KEY = "dialek_forum_diskusi";

export default function ForumDiskusiJawab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("id");
  const questionQueryText = searchParams.get("question");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [namaPengguna, setNamaPengguna] = useState("Pengguna");

  const [semuaPertanyaan, setSemuaPertanyaan] = useState(() => {
    try {
      const tersimpan = localStorage.getItem(STORAGE_KEY);
      return tersimpan ? JSON.parse(tersimpan) : [];
    } catch {
      return [];
    }
  });

  const [answerInput, setAnswerInput] = useState("");
  const [galatJawaban, setGalatJawaban] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

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

  const pertanyaanAktif =
    semuaPertanyaan.find((q) => q.id === questionId) ||
    (questionQueryText
      ? {
          id: "temp",
          author: "Pengguna",
          text: questionQueryText,
          answers: [],
        }
      : null);

  const simpanKeStorage = (daftarBaru) => {
    setSemuaPertanyaan(daftarBaru);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(daftarBaru));
    } catch {
      // Abaikan jika penyimpanan penuh
    }
  };

  const handleKirimJawaban = (e) => {
    e.preventDefault();
    const teks = answerInput.trim();
    if (!teks) {
      setGalatJawaban("Tolong masukkan jawaban terlebih dahulu.");
      return;
    }

    const jawabanBaru = {
      id: `a-${Date.now()}`,
      author: namaPengguna,
      text: teks,
      likes: 0,
      liked: false,
      comments: [],
    };

    const diperbarui = semuaPertanyaan.map((q) =>
      q.id === pertanyaanAktif?.id
        ? { ...q, answers: [...(q.answers || []), jawabanBaru] }
        : q
    );

    simpanKeStorage(diperbarui);
    setAnswerInput("");
    setGalatJawaban("");
  };

  const toggleLikeJawaban = (answerId) => {
    const diperbarui = semuaPertanyaan.map((q) => {
      if (q.id !== pertanyaanAktif?.id) return q;
      return {
        ...q,
        answers: (q.answers || []).map((ans) => {
          if (ans.id !== answerId) return ans;
          const likedBaru = !ans.liked;
          return {
            ...ans,
            liked: likedBaru,
            likes: ans.likes + (likedBaru ? 1 : -1),
          };
        }),
      };
    });
    simpanKeStorage(diperbarui);
  };

  const handleKirimKomentar = (answerId) => {
    const teks = (commentInputs[answerId] || "").trim();
    if (!teks) return;

    const komentarBaru = {
      id: `c-${Date.now()}`,
      author: namaPengguna,
      text: teks,
    };

    const diperbarui = semuaPertanyaan.map((q) => {
      if (q.id !== pertanyaanAktif?.id) return q;
      return {
        ...q,
        answers: (q.answers || []).map((ans) =>
          ans.id === answerId
            ? { ...ans, comments: [...(ans.comments || []), komentarBaru] }
            : ans
        ),
      };
    });

    simpanKeStorage(diperbarui);
    setCommentInputs((prev) => ({ ...prev, [answerId]: "" }));
  };

  const daftarJawaban = pertanyaanAktif?.answers || [];

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
          {/* Pertanyaan yang Ditampilkan */}
          <section className="mb-6 flex items-start gap-3">
            <FaQuestionCircle className="text-3xl text-green-800 shrink-0 mt-1" />
            <div className="flex-grow p-5 rounded-2xl bg-[#4C968B] text-white shadow">
              {pertanyaanAktif ? (
                <>
                  <span className="block text-xs text-white/80 font-medium mb-1">
                    Ditanyakan oleh {pertanyaanAktif.author}
                  </span>
                  <p className="text-base md:text-lg font-medium">
                    {pertanyaanAktif.text}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/90">
                  Pertanyaan tidak ditemukan.
                </p>
              )}
            </div>
          </section>

          {/* Form Input Jawaban */}
          {pertanyaanAktif && (
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
                />
                <button
                  type="submit"
                  aria-label="Kirim jawaban"
                  title="Kirim Jawaban"
                  className="w-12 h-12 rounded-full bg-green-800 hover:bg-green-700 text-white flex items-center justify-center shadow-md shrink-0 transition cursor-pointer"
                >
                  <FaPaperPlane className="text-lg" />
                </button>
              </div>
              {galatJawaban && (
                <p className="mt-2 text-xs sm:text-sm text-red-700 font-medium" role="alert">
                  {galatJawaban}
                </p>
              )}
            </form>
          )}

          {/* Daftar Jawaban */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-green-800">
              Jawaban ({daftarJawaban.length})
            </h2>

            {daftarJawaban.length === 0 ? (
              <p className="text-sm text-custom2 bg-white/50 rounded-2xl p-5 text-center">
                Belum ada jawaban. Jadilah yang pertama membantu menjawab!
              </p>
            ) : (
              <div className="space-y-4">
                {daftarJawaban.map((ans) => {
                  const komentarTerbuka = Boolean(openComments[ans.id]);
                  const daftarKomentar = ans.comments || [];

                  return (
                    <div
                      key={ans.id}
                      className="flex flex-col p-4 rounded-2xl bg-[#68A192] text-white shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-custom9 text-custom2 font-bold flex items-center justify-center shrink-0">
                          {(ans.author || "P").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="font-semibold text-sm text-white/95">
                            {ans.author}
                          </span>
                          <p className="text-sm sm:text-base mt-0.5 break-words">
                            {ans.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleLikeJawaban(ans.id)}
                            aria-label="Sukai jawaban"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/15 transition cursor-pointer"
                          >
                            <FaHeart
                              className={`text-sm ${
                                ans.liked ? "text-green-900" : "text-white"
                              }`}
                            />
                            <span className="text-sm font-semibold">
                              {ans.likes}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenComments((prev) => ({
                                ...prev,
                                [ans.id]: !prev[ans.id],
                              }))
                            }
                            aria-label="Lihat komentar"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/15 transition cursor-pointer"
                          >
                            <FaComment className="text-sm text-white" />
                            <span className="text-sm font-semibold">
                              {daftarKomentar.length}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Bagian Komentar */}
                      {komentarTerbuka && (
                        <div className="mt-3 ml-6 sm:ml-12 space-y-2 border-t border-white/20 pt-3">
                          {daftarKomentar.map((kom) => (
                            <div
                              key={kom.id}
                              className="flex items-start gap-2.5 bg-[#5A897C] p-2.5 rounded-xl"
                            >
                              <div className="w-7 h-7 rounded-full bg-custom9 text-custom2 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {(kom.author || "P").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-grow min-w-0">
                                <span className="text-xs font-semibold text-white/95 block">
                                  {kom.author}
                                </span>
                                <p className="text-sm text-white break-words">
                                  {kom.text}
                                </p>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={commentInputs[ans.id] || ""}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [ans.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleKirimKomentar(ans.id);
                                }
                              }}
                              placeholder="Tulis komentar..."
                              className="w-full px-3 py-2 rounded-xl bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-custom1"
                            />
                            <button
                              type="button"
                              onClick={() => handleKirimKomentar(ans.id)}
                              className="bg-green-900 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
                            >
                              Kirim
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
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