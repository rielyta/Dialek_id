import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { HiUser, HiLockClosed } from "react-icons/hi";
import FormInput from "./FormInput";
import { loginManual } from "../../service/auth";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, setIsLoading, setErrorMessage } = useOutletContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Username/e-mail dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    const result = await loginManual({ identifier: identifier.trim(), password });
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
        label="Username atau E-mail"
        id="identifier"
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="username atau nama@domain.com"
        icon={HiUser}
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
