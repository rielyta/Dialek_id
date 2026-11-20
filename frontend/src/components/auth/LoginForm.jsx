import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { HiMail, HiLockClosed } from "react-icons/hi";
import FormInput from "./FormInput";
import { loginManual } from "../../service/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, setIsLoading, setErrorMessage } = useOutletContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("E-mail dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    const result = await loginManual(email.trim(), password);
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
        label="E-mail"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@domain.com"
        icon={HiMail}
        disabled={isLoading}
      />

      <FormInput
        label="Kata Sandi"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={HiLockClosed}
        disabled={isLoading}
      />

      <div className="text-center mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="text-lg py-2 bg-custom-green-button w-44 text-white font-bold rounded-lg hover:opacity-80 transition duration-300 disabled:opacity-50"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </div>
    </form>
  );
}