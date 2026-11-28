import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import FeedbackCard from "../components/common/FeedbackCard";
import {
  ambilDaftarMateri,
  ambilDetailMateri,
  jawabLatihan,
  kirimRating,
} from "../service/materi";

export default function MateriLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [materiList, setMateriList] = useState([]);
  const [materiIndex, setMateriIndex] = useState(0);
  const [detail, setDetail] = useState(null);

  // State halaman: loading | materi | latihan | hasil | feedback | error
  const [phase, setPhase] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // State latihan
  const [jawabanMap, setJawabanMap] = useState({});
  const [sedangKirim, setSedangKirim] = useState(false);
  const [hasilLatihan, setHasilLatihan] = useState(null);

  useEffect(() => {
    let aktif = true;

    async function muatAwal() {
      setPhase("loading");
      setErrorMsg("");
      setMateriIndex(0);
      setDetail(null);
      setJawabanMap({});
      setHasilLatihan(null);

      try {
        const data = await ambilDaftarMateri(slug);
        if (!aktif) return;

        const list = data || [];
        setMateriList(list);

        if (list.length === 0) {
          setPhase("error");
          setErrorMsg("Belum ada materi untuk kategori ini.");
          return;
        }

        const detailAwal = await ambilDetailMateri(list[0].materiId);
        if (!aktif) return;

        setDetail(detailAwal);
        setPhase("materi");
      } catch (err) {
        if (!aktif) return;
        if (err.status === 401) {
          navigate("/auth/login");
          return;
        }
        setPhase("error");
        setErrorMsg(err.message || "Materi tidak ditemukan.");
      }
    }

    muatAwal();

    return () => {
      aktif = false;
    };
  }, [slug, navigate]);

  async function muatDetail(materiId) {
    setPhase("loading");
    setErrorMsg("");
    try {
      const d = await ambilDetailMateri(materiId);
      setDetail(d);
      setJawabanMap({});
      setHasilLatihan(null);
      setPhase("materi");
    } catch (err) {
      if (err.status === 401) {
        navigate("/auth/login");
        return;
      }
      setPhase("error");
      setErrorMsg(err.message || "Gagal memuat detail materi.");
    }
  }

  const hasLatihan = (detail?.latihan?.length || 0) > 0;
  const isLastMateri = materiIndex >= materiList.length - 1;
  const semuaTerjawab =
    hasLatihan &&
    detail.latihan.every((lat) => (jawabanMap[lat.latihanId] || "").trim() !== "");

  const handleLanjutKeLatihan = () => {
    setErrorMsg("");
    if (hasLatihan) {
      setPhase("latihan");
    } else {
      setPhase("feedback");
    }
  };

  const handleJawabanChange = (latihanId, value) => {
    setJawabanMap((prev) => ({ ...prev, [latihanId]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleKirimJawaban = async () => {
    if (!detail || sedangKirim) return;

    const jawaban = (detail.latihan || []).map((lat) => ({
      latihanId: lat.latihanId,
      jawaban: (jawabanMap[lat.latihanId] || "").trim(),
    }));

    if (jawaban.some((j) => !j.jawaban)) {
      setErrorMsg("Tolong jawab semua pertanyaan terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    setErrorMsg("");

    try {
      const hasil = await jawabLatihan(detail.materiId, jawaban);
      setHasilLatihan(hasil);
      setPhase("hasil");
    } catch (err) {
      if (err.status === 401) {
        navigate("/auth/login");
        return;
      }
      setErrorMsg(err.message || "Gagal mengirim jawaban.");
    } finally {
      setSedangKirim(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    if (!detail) {
      navigate("/pilih-materi");
      return;
    }

    try {
      await kirimRating(detail.materiId, feedbackData.rating);
    } catch {
      // Tetap lanjutkan navigasi meskipun pengiriman rating gagal
    }

    const nextIdx = materiIndex + 1;
    if (nextIdx < materiList.length) {
      setMateriIndex(nextIdx);
      await muatDetail(materiList[nextIdx].materiId);
    } else {
      navigate("/pilih-materi");
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (phase === "feedback") {
      setPhase(hasilLatihan ? "hasil" : "materi");
    } else if (phase === "hasil") {
      setPhase("latihan");
    } else if (phase === "latihan") {
      setPhase("materi");
    } else {
      navigate("/pilih-materi");
    }
  };

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen">
      <Navbar disableLogo />

      <section
        id="content-section"
        className="main flex flex-col mx-auto w-11/12 sm:w-4/5 max-w-5xl items-center justify-center flex-grow p-4 sm:p-8 text-custom2"
      >
        {/* LOADING */}
        {phase === "loading" && (
          <p className="text-center text-sm text-custom2 py-6">
            Memuat materi...
          </p>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
            <p className="text-lg font-semibold text-gray-700">{errorMsg}</p>
          </div>
        )}

        {/* MATERI CONTENT */}
        {phase === "materi" && detail && (
          <div className="materi-item w-full bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg font-inter border-[1.5px] border-bar p-6 sm:p-10 drop-shadow-2xl">
            <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold text-gradient font-poppins pb-4 border-b border-gray-300/60">
              {detail.judul}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed pt-6 whitespace-pre-line text-gray-800">
              {detail.isi}
            </p>
          </div>
        )}

        {/* LATIHAN */}
        {phase === "latihan" && detail && (
          <div className="materi-item w-full bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg font-inter border-[1.5px] border-bar p-6 sm:p-10 drop-shadow-2xl">
            <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold text-gradient font-poppins pb-4 border-b border-gray-300/60">
              Latihan Soal
            </h1>

            <div className="pt-6 flex flex-col gap-6">
              {(detail.latihan || []).map((lat, idx) => {
                const opsiList = Array.isArray(lat.opsi)
                  ? lat.opsi
                  : Array.isArray(lat.options)
                  ? lat.options
                  : null;

                return (
                  <div key={lat.latihanId} className="flex flex-col gap-3">
                    <label
                      htmlFor={`lat-${lat.latihanId}`}
                      className="text-base sm:text-lg font-medium text-gray-800"
                    >
                      {idx + 1}. {lat.pertanyaan}
                    </label>

                    {opsiList && opsiList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {opsiList.map((option) => {
                          const isSelected =
                            jawabanMap[lat.latihanId] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={sedangKirim}
                              onClick={() =>
                                handleJawabanChange(lat.latihanId, option)
                              }
                              className={`w-full text-left px-5 py-3.5 rounded-2xl border transition cursor-pointer ${
                                isSelected
                                  ? "bg-green-50 border-green-700 text-green-900 font-semibold"
                                  : "bg-white/60 border-gray-300 text-gray-800 hover:bg-white"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        id={`lat-${lat.latihanId}`}
                        type="text"
                        value={jawabanMap[lat.latihanId] || ""}
                        onChange={(e) =>
                          handleJawabanChange(lat.latihanId, e.target.value)
                        }
                        placeholder="Ketik jawabanmu..."
                        disabled={sedangKirim}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white/60 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom1"
                      />
                    )}
                  </div>
                );
              })}

              {errorMsg && (
                <p
                  className="text-xs sm:text-sm text-red-700 font-medium"
                  role="alert"
                >
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleKirimJawaban}
                  disabled={!semuaTerjawab || sedangKirim}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    semuaTerjawab && !sedangKirim
                      ? "bg-green-800 hover:bg-green-900 text-white cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {sedangKirim ? "Mengirim..." : "Periksa Jawaban"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HASIL LATIHAN */}
        {phase === "hasil" && hasilLatihan && (
          <div className="materi-item w-full bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg font-inter border-[1.5px] border-bar p-6 sm:p-10 drop-shadow-2xl">
            <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold text-gradient font-poppins pb-4 border-b border-gray-300/60">
              Hasil Latihan
            </h1>

            <div className="pt-6 text-center mb-6">
              <p className="text-4xl font-bold text-green-800">
                {hasilLatihan.skor ?? 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {hasilLatihan.jumlahBenar} dari {hasilLatihan.jumlahSoal} benar
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {(hasilLatihan.hasil || []).map((h, idx) => (
                <div
                  key={h.latihanId || idx}
                  className={`p-4 rounded-2xl border ${
                    h.benar
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <p className="font-medium text-gray-800 text-sm sm:text-base">
                    {idx + 1}. {h.pertanyaan}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="text-gray-500">Jawabanmu:</span>{" "}
                    <span
                      className={
                        h.benar
                          ? "text-green-800 font-semibold"
                          : "text-red-700 font-semibold"
                      }
                    >
                      {h.jawaban || "-"}
                    </span>
                  </p>
                  {!h.benar && h.kunciJawaban && (
                    <p className="text-sm mt-0.5">
                      <span className="text-gray-500">Jawaban benar:</span>{" "}
                      <span className="text-green-800 font-semibold">
                        {h.kunciJawaban}
                      </span>
                    </p>
                  )}
                  {h.pembahasan && (
                    <p className="text-sm mt-1 text-gray-600 italic">
                      {h.pembahasan}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEEDBACK / RATING */}
        {phase === "feedback" && (
          <FeedbackCard onSubmit={handleFeedbackSubmit} />
        )}
      </section>

      {phase !== "feedback" && phase !== "loading" && (
        <footer className="flex items-center justify-between w-full px-4 py-6 mt-auto">
          <button
            type="button"
            onClick={handleBack}
            className="button-custom2 border border-green-700 text-green-800 hover:bg-green-700 hover:text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
          >
            Kembali
          </button>

          {phase === "materi" && (
            <button
              type="button"
              onClick={handleLanjutKeLatihan}
              className="button-custom bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
            >
              {hasLatihan ? "Selanjutnya" : "Selesai"}
            </button>
          )}

          {phase === "hasil" && (
            <button
              type="button"
              onClick={() => setPhase("feedback")}
              className="button-custom bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
            >
              {isLastMateri ? "Selesai" : "Selanjutnya"}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}