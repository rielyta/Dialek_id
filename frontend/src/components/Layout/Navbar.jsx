import { Link } from "react-router-dom";
import ProfileButton from "./ProfileButton";

export default function Navbar({
  nama,
  username,
  onLogoClick,
  profilePath = "/profil",
  showProfile = true,
}) {
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

      {showProfile && (
        <ProfileButton
          nama={nama || username}
          profilePath={profilePath}
        />
      )}
    </nav>
  );
}