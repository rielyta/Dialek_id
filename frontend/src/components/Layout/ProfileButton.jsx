import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { ambilAkun } from "../../service/akun";
import { auth } from "../../service/firebase";

export default function ProfileButton({
  nama,
  profilePath = "/profil",
  disabled = false,
}) {
  const navigate = useNavigate();
  const [namaAkun, setNamaAkun] = useState("");

  useEffect(() => {
    if (nama) return;

    let aktif = true;
    ambilAkun()
      .then((akun) => {
        if (!aktif) return;
        const namaTampil =
          akun?.nama ||
          auth.currentUser?.displayName ||
          "Pengguna";
        setNamaAkun(namaTampil);
      })
      .catch(() => {
        if (!aktif) return;
        setNamaAkun(
          auth.currentUser?.displayName ||
            auth.currentUser?.email?.split("@")[0] ||
            "Pengguna"
        );
      });

    return () => {
      aktif = false;
    };
  }, [nama]);

  const teksTampil = nama || namaAkun || "Pengguna";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && navigate(profilePath)}
      className={`flex items-center m-0 font-semibold text-custom2 focus:outline-none ${
        disabled
          ? "cursor-default"
          : "cursor-pointer hover:text-custom1 transition"
      }`}
    >
      <span className="px-3 md:px-4 text-base md:text-xl" data-testid="username">
        {teksTampil}
      </span>
      <FaUser className="text-xl md:text-2xl" />
    </button>
  );
}