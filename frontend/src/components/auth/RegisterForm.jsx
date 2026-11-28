import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { HiUser, HiMail, HiLockClosed } from "react-icons/hi";
import FormInput from "./FormInput";
import { registerManual } from "../../service/auth";

export default function RegisterForm() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { isLoading, setIsLoading, setErrorMessage } = useOutletContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { nama, email, password, confirmPassword } = form;
    if (!nama.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("Semua field wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    const result = await registerManual({
      nama: nama.trim(),
      email: email.trim(),
      password,
    });
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard-batak");
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Nama Lengkap"
        id="nama"
        value={form.nama}
        onChange={handleChange}
        placeholder="Jane Doe"
        icon={HiUser}
        disabled={isLoading}
      />

      <FormInput
        label="E-mail"
        id="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="nama@domain.com"
        icon={HiMail}
        disabled={isLoading}
      />

      <FormInput
        label="Kata Sandi"
        id="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        icon={HiLockClosed}
        disabled={isLoading}
      />

      <FormInput
        label="Konfirmasi Kata Sandi"
        id="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        icon={HiLockClosed}
        disabled={isLoading}
      />

      <div className="text-center mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="text-lg py-2 bg-custom-green-button w-44 text-white font-bold rounded-lg hover:opacity-80 transition duration-300 disabled:opacity-50"
        >
          {isLoading ? "Mendaftar..." : "Daftar"}
        </button>
      </div>
    </form>
  );
}