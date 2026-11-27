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
    <nav className="flex items-center justify-between w-full px-6 py-8 md:px-12 md:py-10">
      {disableLogo || onLogoClick ? (
        <button
          type="button"
          disabled={disableLogo}
          onClick={disableLogo ? undefined : onLogoClick}
          className={logoClass}
        >
          dialek.id
        </button>
      ) : (
        <Link to="/dashboard-batak" className={logoClass}>
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