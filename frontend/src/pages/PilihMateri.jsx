import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaBookOpen } from "react-icons/fa";
import Navbar from "../components/Layout/Navbar";
import Sidebar from "../components/Layout/Sidebar";

const TOPICS_DATA = [
  { id: "subjek", title: "Subjek", unlocked: true, progress: 0 },
  { id: "kata-kerja", title: "Kata Kerja", unlocked: false, progress: 0 },
  { id: "kata-benda", title: "Kata Benda", unlocked: false, progress: 0 },
  { id: "bilangan", title: "Bilangan", unlocked: false, progress: 0 },
];

export default function PilihMateri() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-10 w-full px-2 sm:px-4">
          {TOPICS_DATA.map((topic) => (
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
                <span className="text-lg md:text-xl font-semibold text-gray-700 truncate">
                  {topic.title}
                </span>
                <div className="w-full h-3 bg-gray-200 rounded-md overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, topic.progress))}%`,
                    }}
                    className="progress-bar bg-green-600 h-full transition-all duration-300"
                  />
                </div>
              </div>

              {topic.unlocked ? (
                <button
                  type="button"
                  onClick={() => navigate(`/materi/${topic.id}`)}
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