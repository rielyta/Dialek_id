import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen md:h-screen md:overflow-hidden">
      {/* Konten Utama */}
      <section
        id="home"
        className="flex-1 flex flex-col justify-center mx-auto w-11/12 md:w-4/5 lg:w-3/4 max-w-5xl py-8 md:py-4"
      >
        <main className="flex flex-col items-center">
          {/* Judul & Deskripsi */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient font-poppins">
              Belajar Bahasa Daerah dengan Menyenangkan
            </h1>
            <p className="text-base md:text-lg mt-3 text-gray-800 max-w-2xl mx-auto">
              Kami akan membantu Anda dalam mempelajari bahasa daerah dan memahami
              tradisi serta budaya suku-suku di Indonesia.
            </p>
          </div>

          {/* Seksi Fitur (3 kolom di desktop agar tidak memakan tinggi layar) */}
          <section id="materi" className="w-full mt-6 md:mt-8">
            <div className="bg-white/30 backdrop-blur-sm rounded-xl shadow-lg font-inter text-custom2 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-poppins font-bold pb-1.5">
                  Materi
                </h3>
                <p className="opacity-80 text-sm md:text-base">
                  Materi pembelajaran yang lengkap dan seru
                </p>
              </div>

              <div id="permainan" className="p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-poppins font-bold pb-1.5">
                  Permainan
                </h3>
                <p className="opacity-80 text-sm md:text-base">
                  Permainan yang dapat mengukur kemampuan berbahasamu
                </p>
              </div>

              <div id="komunitas" className="p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-poppins font-bold pb-1.5">
                  Komunitas
                </h3>
                <p className="opacity-80 text-sm md:text-base">
                  Diskusikan pertanyaanmu dengan pengguna lainnya
                </p>
              </div>
            </div>
          </section>

          {/* Button Masuk dan Daftar */}
          <div className="flex items-center justify-center space-x-4 mt-6 md:mt-8 font-poppins font-medium">
            <Link
              to="/auth/login"
              className="px-8 py-2.5 bg-white text-custom1 border border-custom1 rounded-full hover:bg-custom1 hover:text-white transition"
            >
              Masuk
            </Link>
            <Link
              to="/auth/register"
              className="px-8 py-2.5 bg-custom1 text-white rounded-full hover:opacity-90 transition"
            >
              Daftar
            </Link>
          </div>
        </main>
      </section>

      {/* Footer */}
      <footer className="bg-custom3 text-white py-3.5 md:py-4 shrink-0">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs md:text-sm">
            &copy; 2026 Dialek.id. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}