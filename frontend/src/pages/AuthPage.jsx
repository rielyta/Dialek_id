import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiMail, HiLockClosed, HiUser, HiClock, HiX } from "react-icons/hi";
import FormInput from "../components/auth/FormInput";
import SocialButtons from "../components/auth/SocialButtons";
import {
  loginManual,
  registerManual,
  authWithSocial,
  logout,
} from "../service/auth";

import jawaImg from "../assets/jawa.webp";
import batakImg from "../assets/batak.webp";

export default function AuthPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const isSocialPending = useRef(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isRegister = location.pathname.includes("register");

  useEffect(() => {
    setErrorMessage("");
    setFormData({
      nama: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  }, [location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isSocialPending.current) return;
    setErrorMessage("");

    if (isRegister) {
      if (!formData.nama.trim() || !formData.email.trim() || !formData.password) {
        setErrorMessage("Semua kolom wajib diisi.");
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage("Kata sandi minimal 6 karakter.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    } else if (!formData.email.trim() || !formData.password) {
      setErrorMessage("E-mail dan kata sandi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const result = isRegister
      ? await registerManual({
          nama: formData.nama.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
      : await loginManual({
          email: formData.email.trim(),
          password: formData.password,
        });
    setIsSubmitting(false);

    if (result.success) {
      setIsAuthSuccess(true);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleSocialAuth = async (providerKey) => {
    if (isSubmitting || isSocialPending.current) return;
    isSocialPending.current = true;
    setErrorMessage("");

    const result = await authWithSocial(providerKey);
    isSocialPending.current = false;

    if (result.success) {
      setIsAuthSuccess(true);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="bg-custom-radial font-inter flex flex-col min-h-screen">
      <nav className="flex items-center justify-between w-full px-6 py-8 md:p-12">
        <Link
          to="/"
          className="logo font-irish m-0 text-2xl hover:opacity-80 transition"
        >
          dialek.id
        </Link>
      </nav>

      <section className="main flex flex-col mx-auto w-11/12 sm:w-4/5 flex-grow justify-center pb-10">
        <div className="flex items-center justify-center px-2 sm:px-4">
          {isAuthSuccess ? (
            /* Tampilan Pilih Bahasa Setelah Masuk / Daftar Berhasil */
            <div className="bg-shadow p-6 sm:p-8 w-full max-w-lg text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2 font-poppins">
                Pilih Bahasa Yang Ingin Dipelajari
              </h2>
              <p className="text-sm sm:text-base text-gray-700 mb-6">
                Pilih bahasa daerah yang ingin kamu pelajari hari ini.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opsi Bahasa Batak Toba */}
                <button
                  type="button"
                  onClick={() => navigate("/dashboard-batak", { replace: true })}
                  className="group bg-white/70 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-custom1 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center cursor-pointer focus:outline-none"
                >
                  <img
                    src={batakImg}
                    alt="Bahasa Batak Toba"
                    className="h-20 w-20 rounded-full object-cover mb-3 shadow-xs group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="text-base font-poppins font-bold text-gray-900 group-hover:text-custom1 transition">
                    Batak Toba
                  </span>
                  <span className="mt-1.5 px-3 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Mulai Belajar
                  </span>
                </button>

                {/* Opsi Bahasa Jawa */}
                <button
                  type="button"
                  onClick={() => setShowComingSoonModal(true)}
                  className="group bg-white/70 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center cursor-pointer focus:outline-none"
                >
                  <img
                    src={jawaImg}
                    alt="Bahasa Jawa"
                    className="h-20 w-20 rounded-full object-cover mb-3 shadow-xs group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="text-base font-poppins font-bold text-gray-900 group-hover:text-custom1 transition">
                    Jawa
                  </span>
                  <span className="mt-1.5 px-3 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                    Segera Hadir
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Form Masuk / Daftar */
            <div className="bg-shadow p-6 sm:p-8 w-full max-w-md">
              <h2 className="text-4xl font-bold text-center text-gradient mb-6 w-full font-poppins">
                {isRegister ? "Daftar" : "Masuk"}
              </h2>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <FormInput
                    label="Nama Lengkap"
                    id="nama"
                    name="nama"
                    type="text"
                    value={formData.nama}
                    onChange={handleChange}
                    icon={HiUser}
                    disabled={isSubmitting}
                  />
                )}

                <FormInput
                  label="E-mail"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={HiMail}
                  disabled={isSubmitting}
                />

                <FormInput
                  label="Kata Sandi"
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={HiLockClosed}
                  disabled={isSubmitting}
                />

                {isRegister && (
                  <FormInput
                    label="Konfirmasi Kata Sandi"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={HiLockClosed}
                    disabled={isSubmitting}
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-custom1 text-white font-semibold rounded-full hover:opacity-90 transition duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
                </button>
              </form>

              <div className="my-5 flex items-center">
                <hr className="flex-grow border-t border-black" />
                <span className="mx-4 text-black text-sm">atau</span>
                <hr className="flex-grow border-t border-black" />
              </div>

              <SocialButtons
                isRegister={isRegister}
                disabled={isSubmitting}
                onSocialAuth={handleSocialAuth}
              />

              <div className="text-center mt-5">
                {isRegister ? (
                  <p className="text-black text-sm">
                    Sudah Punya Akun?{" "}
                    <Link
                      to="/auth/login"
                      className="text-custom1 font-bold hover:underline"
                    >
                      Masuk
                    </Link>
                  </p>
                ) : (
                  <p className="text-black text-sm">
                    Belum Punya Akun?{" "}
                    <Link
                      to="/auth/register"
                      className="text-custom1 font-bold hover:underline"
                    >
                      Daftar
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pop-up Modal Coming Soon untuk Bahasa Jawa */}
      {showComingSoonModal && (
        <div
          onClick={() => setShowComingSoonModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-7 text-center"
          >
            <button
              type="button"
              onClick={() => setShowComingSoonModal(false)}
              aria-label="Tutup pop-up"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <HiX className="w-5 h-5" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <HiClock className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              Segera Hadir!
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Modul pembelajaran <strong>Bahasa Jawa</strong> sedang dalam tahap
              pengembangan.
            </p>

            <button
              type="button"
              onClick={() => setShowComingSoonModal(false)}
              className="w-full py-2.5 px-4 bg-custom1 text-white font-poppins font-semibold text-sm rounded-full hover:opacity-90 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}