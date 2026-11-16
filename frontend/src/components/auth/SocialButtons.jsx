import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

export default function SocialButtons({ isRegister, disabled, onSocialAuth }) {
  const prefix = isRegister ? "Daftar" : "Masuk";

  return (
    <div className="flex flex-col space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSocialAuth("google")}
        className="relative flex justify-center items-center w-full py-2.5 px-4 border border-green-600 rounded-full text-green-700 font-medium hover:bg-green-50 transition duration-300 disabled:opacity-50"
      >
        <FcGoogle className="w-5 h-5 absolute left-4" />
        <span>{prefix} dengan akun Google</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSocialAuth("facebook")}
        className="relative flex justify-center items-center w-full py-2.5 px-4 border border-green-600 rounded-full text-green-700 font-medium hover:bg-green-50 transition duration-300 disabled:opacity-50"
      >
        <FaFacebook className="w-5 h-5 absolute left-4 text-[#1877F2]" />
        <span>{prefix} dengan akun Facebook</span>
      </button>
    </div>
  );
}