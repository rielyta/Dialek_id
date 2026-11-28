import { Link } from "react-router-dom";
import ProfileButton from "./ProfileButton";

export default function Navbar({
  nama,
  username,
  onLogoClick,
  profilePath = "/profil",
  showProfile = true,
  disableLogo = false,
}) {
  const logoClass = `logo font-irish m-0 text-2xl focus:outline-none ${
    disableLogo
      ? "cursor-default"
      : "cursor-pointer hover:opacity-80 transition"
  }`;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between w-full px-6 py-6 md:px-12 md:py-8 bg-white/40 backdrop-blur-md">
      {disableLogo ? (
        <span
          aria-disabled="true"
          className="logo font-irish m-0 text-2xl select-none cursor-default"
        >
          dialek.id
        </span>
      ) : onLogoClick ? (
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
          disabled={disableLogo}
        />
      )}
    </nav>
  );
}