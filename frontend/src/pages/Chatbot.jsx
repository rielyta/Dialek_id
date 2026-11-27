import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";
import { kirimPesanChatbot } from "../service/chatbot";

const PESAN_PEMBUKA = {
  id: "welcome-1",
  peran: "bot",
  teks: "Horas! Aku asisten AI Dialek.id. Silakan tanya arti kata, tata bahasa Batak Toba, atau seputar Dialek.id",
};

const CONTOH_PERTANYAAN = [
  "Apa arti kata 'Horas'?",
  "Cara memperkenalkan diri dalam Bahasa Batak Toba",
  "Perbedaan 'Hita' dan 'Hami'",
];

export default function Chatbot() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pesanList, setPesanList] = useState([PESAN_PEMBUKA]);
  const [inputPesan, setInputPesan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");

  const akhirChatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    akhirChatRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pesanList, mengirim]);

  const prosesKirim = async (teksMentah) => {
    const teks = teksMentah.trim();
    if (!teks || mengirim) return;

    setGalat("");
    const pesanUser = {
      id: `user-${Date.now()}`,
      peran: "user",
      teks,
    };

    const riwayatTerbaru = [...pesanList, pesanUser];
    setPesanList(riwayatTerbaru);
    setInputPesan("");
    setMengirim(true);

    try {
      const balasan = await kirimPesanChatbot(teks, riwayatTerbaru);
      setPesanList((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          peran: "bot",
          teks: balasan,
        },
      ]);
    } catch (err) {
      if (err?.status === 401) {
        navigate("/auth/login", { replace: true });
        return;
      }
      setGalat(err?.message || "Terjadi kesalahan saat menghubungi chatbot.");
    } finally {
      setMengirim(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    prosesKirim(inputPesan);
  };

  const handleResetChat = () => {
    if (mengirim) return;
    setPesanList([PESAN_PEMBUKA]);
    setGalat("");
    setInputPesan("");
  };

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Navbar onLogoClick={() => setIsSidebarOpen(true)} />

      {/* Konten Utama */}
      <main className="flex flex-col items-center flex-grow w-11/12 sm:w-4/5 max-w-4xl mx-auto pb-8">
        <header className="w-full flex items-center justify-center relative mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient font-poppins text-center">
            Chatbot
          </h1>

          {pesanList.length > 1 && (
            <button
              type="button"
              onClick={handleResetChat}
              disabled={mengirim}
              title="Mulai percakapan baru"
              aria-label="Hapus riwayat percakapan"
              className="absolute right-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-custom4 hover:brightness-75 transition disabled:opacity-50 cursor-pointer"
            >
              <FaTrashAlt className="text-xs" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </header>

        {/* Kotak Percakapan */}
        <section
          aria-label="Ruang percakapan chatbot"
          className="w-full flex flex-col justify-between h-[64vh] min-h-[430px] max-h-[620px] rounded-3xl border border-[#5E9B8B]/70 bg-white/30 backdrop-blur-sm shadow-sm p-4 sm:p-6 md:p-8"
        >
          {/* Daftar Chat Bubble */}
          <div
            className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5E9B8B]/50 [&::-webkit-scrollbar-thumb]:rounded-full"
            aria-live="polite"
          >
            {pesanList.map((item) => {
              const dariUser = item.peran === "user";
              return (
                <div
                  key={item.id}
                  className={`flex w-full ${
                    dariUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    data-testid={dariUser ? "bubble-user" : "bubble-bot"}
                    className={`max-w-[82%] sm:max-w-[70%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-line shadow-sm ${
                      dariUser
                        ? "bg-[#4C968B] text-white rounded-br-sm"
                        : "bg-[#134226] text-white rounded-bl-sm"
                    }`}
                  >
                    {item.teks}
                  </div>
                </div>
              );
            })}

            {mengirim && (
              <div className="flex justify-start" data-testid="indikator-mengetik">
                <div className="px-5 py-3.5 rounded-2xl rounded-bl-sm bg-[#134226] text-white/85 text-sm italic shadow-sm">
                  Sedang mengetik...
                </div>
              </div>
            )}

            <div ref={akhirChatRef} />
          </div>

          {pesanList.length === 1 && !mengirim && (
            <div className="flex flex-wrap gap-2 pt-3">
              {CONTOH_PERTANYAAN.map((contoh) => (
                <button
                  key={contoh}
                  type="button"
                  onClick={() => prosesKirim(contoh)}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-white/60 hover:bg-white border border-[#5E9B8B]/50 text-custom2 font-medium transition cursor-pointer"
                >
                  {contoh}
                </button>
              ))}
            </div>
          )}

          {galat && (
            <p
              role="alert"
              data-testid="galat-chatbot"
              className="mt-2 text-xs sm:text-sm text-red-700 font-medium text-center"
            >
              {galat}
            </p>
          )}

          {/* Input Pertanyaan */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2.5 sm:gap-3 pt-4 mt-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPesan}
              onChange={(e) => setInputPesan(e.target.value)}
              disabled={mengirim}
              placeholder="Tulis pertanyaanmu seputar Bahasa Batak Toba..."
              aria-label="Pesan untuk chatbot"
              data-testid="input-chatbot"
              className="flex-1 rounded-full border border-[#5E9B8B] bg-[#D4E5DD]/65 px-5 py-2.5 text-sm md:text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-custom1 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={mengirim || !inputPesan.trim()}
              data-testid="tombol-kirim-chatbot"
              className="px-6 sm:px-8 py-2.5 rounded-full bg-[#1B5E3A] hover:bg-[#14472C] text-white text-sm md:text-base font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              Kirim
            </button>
          </form>
        </section>
      </main>

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