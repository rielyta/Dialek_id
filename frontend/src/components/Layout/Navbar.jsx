import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

export default function Navbar({
  username = "Pengguna",
  onLogoClick,
  profilePath = "/akun",
}) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between w-full px-6 py-8 md:px-12 md:py-10">
      {onLogoClick ? (
        <button
          type="button"
          onClick={onLogoClick}
          className="logo font-irish m-0 text-2xl cursor-pointer hover:opacity-80 transition focus:outline-none"
        >
          dialek.id
        </button>
      ) : (
        <Link
          to="/dashboard-batak"
          className="logo font-irish m-0 text-2xl cursor-pointer hover:opacity-80 transition"
        >
          dialek.id
        </Link>
      )}

      <button
        type="button"
        onClick={() => navigate(profilePath)}
        className="flex items-center m-0 font-semibold text-custom2 cursor-pointer hover:text-custom1 transition focus:outline-none"
      >
        <span className="px-3 md:px-4 text-lg md:text-xl">{username}</span>
        <FaUser className="text-xl md:text-2xl" />
      </button>
    </nav>
  );
}