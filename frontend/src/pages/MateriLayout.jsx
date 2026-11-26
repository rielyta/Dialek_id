import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import FeedbackCard from "../components/common/FeedbackCard";

const MATERI_DATA = {
  subjek: [
    {
      type: "materi",
      title: "Subjek (Kata Ganti Orang Tunggal)",
      content: `Dalam bahasa Batak Toba, kata ganti orang (subjek) digunakan untuk menunjuk diri sendiri, lawan bicara, maupun orang yang dibicarakan.

Berikut subjek tunggal dalam Bahasa Batak Toba:
- Ahu = Saya / Aku
- Ho = Kamu / Engkau
- Ibana = Dia (tunggal)`,
    },
    {
      type: "latihan",
      question: 'Apa arti dari kata subjek "Ahu" dalam Bahasa Indonesia?',
      options: ["Kamu", "Saya / Aku", "Dia", "Mereka"],
      answer: "Saya / Aku",
    },
    {
      type: "materi",
      title: "Subjek Jamak & Bentuk Sopan",
      content: `Selain subjek tunggal, Bahasa Batak Toba juga membedakan kata ganti jamak dan bentuk sapaan sopan:

- Hita = Kita (termasuk lawan bicara)
- Hami = Kami (tidak termasuk lawan bicara)
- Hamu = Kalian / Anda (sopan)
- Nasida = Mereka`,
    },
    {
      type: "latihan",
      question: 'Subjek mana yang berarti "Kita" (termasuk lawan bicara)?',
      options: ["Hami", "Hamu", "Hita", "Nasida"],
      answer: "Hita",
    },
    {
      type: "materi",
      title: "Contoh Penggunaan Subjek dalam Kalimat",
      content: `Berikut contoh penerapan subjek dalam kalimat sederhana sehari-hari:

- Mangan do ahu. = Saya sedang makan.
- Tudia ho lao? = Ke mana kamu pergi?
- Marjaha buku do nasida. = Mereka sedang membaca buku.`,
    },
    {
      type: "latihan",
      question: 'Terjemahkan kalimat: "Tudia ho lao?"',
      options: [
        "Ke mana kamu pergi?",
        "Apa yang sedang kamu makan?",
        "Siapa nama dia?",
        "Di mana rumah mereka?",
      ],
      answer: "Ke mana kamu pergi?",
    },
  ],
  "kata-kerja": [
    {
      type: "materi",
      title: "Kata Kerja (Hata Ulaon)",
      content: `Kata kerja dalam Bahasa Batak Toba disebut Hata Ulaon, yaitu kata yang menyatakan suatu tindakan atau aktivitas.

Contoh kata kerja sehari-hari:
- Mangan = Makan
- Minum = Minum
- Modom = Tidur
- Mardalan = Berjalan
- Marjaha = Membaca`,
    },
    {
      type: "latihan",
      question: 'Apa bahasa Batak Toba dari kata "Tidur"?',
      options: ["Mangan", "Mardalan", "Modom", "Marjaha"],
      answer: "Modom",
    },
  ],
  "kata-benda": [
    {
      type: "materi",
      title: "Kata Benda (Hata Goar)",
      content: `Kata benda dalam Bahasa Batak Toba disebut Hata Goar, yaitu kata yang merujuk pada benda, tempat, atau sesuatu yang dibendakan.

Contoh kata benda umum:
- Jabu = Rumah
- Aek = Air
- Dalan = Jalan
- Buku = Buku
- Indahan = Nasi`,
    },
    {
      type: "latihan",
      question: 'Apa arti dari kata benda "Jabu"?',
      options: ["Air", "Jalan", "Nasi", "Rumah"],
      answer: "Rumah",
    },
  ],
  bilangan: [
    {
      type: "materi",
      title: "Bilangan (Angka)",
      content: `Berikut adalah penyebutan angka dasar dalam Bahasa Batak Toba:

- Sada = Satu (1)
- Dua = Dua (2)
- Tolu = Tiga (3)
- Opat = Empat (4)
- Lima = Lima (5)`,
    },
    {
      type: "latihan",
      question: 'Angka berapakah "Tolu" dalam Bahasa Batak Toba?',
      options: ["1", "2", "3", "4"],
      answer: "3",
    },
  ],
};

export default function MateriLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const steps = MATERI_DATA[slug] || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setCurrentStepIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setShowFeedback(false);
  }, [slug]);

  const currentStep = steps[currentStepIndex] || null;
  const isLastStep = currentStepIndex === steps.length - 1;

  const latihanNumber = steps
    .slice(0, currentStepIndex + 1)
    .filter((step) => step.type === "latihan").length;

  const displayTitle =
    currentStep?.type === "latihan"
      ? `Latihan Soal ${latihanNumber}`
      : currentStep?.title;

  const handleBack = () => {
    if (showFeedback) {
      setShowFeedback(false);
      return;
    }

    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      navigate("/pilih-materi");
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      setShowFeedback(true);
    }
  };

  const handleFeedbackSubmit = (feedbackData) => {
    console.log("Feedback terkirim:", { slug, ...feedbackData });
    navigate("/pilih-materi");
  };

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen">
      <Navbar />

      <section
        id="content-section"
        className="main flex flex-col mx-auto w-11/12 sm:w-4/5 max-w-5xl items-center justify-center flex-grow p-4 sm:p-8 text-custom2"
      >
        {showFeedback ? (
          <FeedbackCard onSubmit={handleFeedbackSubmit} />
        ) : currentStep ? (
          <div className="materi-item w-full bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg font-inter border-[1.5px] border-bar p-6 sm:p-10 drop-shadow-2xl">
            <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold text-gradient font-poppins pb-4 border-b border-gray-300/60">
              {displayTitle}
            </h1>

            {currentStep.type === "materi" ? (
              <p className="text-base sm:text-lg leading-relaxed pt-6 whitespace-pre-line text-gray-800">
                {currentStep.content}
              </p>
            ) : (
              <div className="pt-6 flex flex-col gap-5">
                <p className="text-base sm:text-lg font-medium text-gray-800">
                  {currentStep.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentStep.options.map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrectAnswer = option === currentStep.answer;

                    let optionStyle =
                      "bg-white/60 border-gray-300 text-gray-800 hover:bg-white";

                    if (isChecked) {
                      if (isCorrectAnswer) {
                        optionStyle =
                          "bg-green-100 border-green-600 text-green-900 font-semibold";
                      } else if (isSelected && !isCorrectAnswer) {
                        optionStyle =
                          "bg-red-100 border-red-500 text-red-900 font-semibold";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "bg-green-50 border-green-700 text-green-900 font-semibold";
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedOption(option);
                          setIsChecked(false);
                        }}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl border transition cursor-pointer ${optionStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!selectedOption}
                    onClick={() => setIsChecked(true)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                      selectedOption
                        ? "bg-green-800 hover:bg-green-900 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Periksa Jawaban
                  </button>

                  {isChecked && (
                    <span
                      className={`text-sm font-semibold ${
                        selectedOption === currentStep.answer
                          ? "text-green-800"
                          : "text-red-700"
                      }`}
                    >
                      {selectedOption === currentStep.answer
                        ? "Jawaban benar!"
                        : `Kurang tepat. Jawaban yang benar: ${currentStep.answer}`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
            <p className="text-lg font-semibold text-gray-700">
              Materi tidak ditemukan.
            </p>
          </div>
        )}
      </section>

      {!showFeedback && (
        <footer className="flex items-center justify-between w-full px-4 py-6 mt-auto">
          <button
            type="button"
            onClick={handleBack}
            className="button-custom2 border border-green-700 text-green-800 hover:bg-green-700 hover:text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
          >
            Kembali
          </button>

          {currentStep && (
            <button
              type="button"
              onClick={handleNext}
              className="button-custom bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-full text-sm mx-4 md:mx-8 transition cursor-pointer"
            >
              {isLastStep ? "Selesai" : "Selanjutnya"}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}