import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  ambilAkun,
  hapusAkun,
  keluar,
  konfirmasiIdentitas,
  segarkanSesi,
  ubahAkun,
} from "../service/akun";

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_BAWAAN = null; 

function Avatar({ nama }) {
  if (AVATAR_BAWAAN) {
    return <img src={AVATAR_BAWAAN} alt="Foto profil" className="w-28 h-28 rounded-full object-cover" />;
  }
  const huruf = (nama || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="w-28 h-28 rounded-full bg-[#5E9B8B] text-white flex items-center justify-center text-5xl font-bold"
      aria-label="Foto profil"
    >
      {huruf}
    </div>
  );
}

function Isian({ id, label, type = "text", value, onChange, disabled, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-custom2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-custom1 disabled:bg-white/60 disabled:text-gray-500"
      />
    </div>
  );
}

// Jendela konfirmasi sebelum akun dihapus.
function DialogHapus({ provider, sedangProses, galat, onBatal, onKonfirmasi }) {
  const [kataSandi, setKataSandi] = useState("");
  const pakaiGoogle = provider === "google";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-hapus"
      data-testid="dialog-hapus"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="judul-hapus" className="text-lg font-bold text-custom2">
          Hapus akun?
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Akun beserta seluruh progres belajarmu akan dihapus permanen dan tidak bisa dikembalikan.
          {pakaiGoogle
            ? " Kamu akan diminta masuk dengan Google sekali lagi untuk konfirmasi."
            : " Masukkan kata sandimu untuk konfirmasi."}
        </p>

        {!pakaiGoogle && (
          <div className="mt-4">
            <Isian
              id="kata-sandi-hapus"
              label="Kata Sandi"
              type="password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}

        {galat && (
          <p className="mt-3 text-sm text-custom4" role="alert" data-testid="galat-hapus">
            {galat}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBatal}
            disabled={sedangProses}
            className="px-4 py-2 rounded-full border border-custom1 text-custom1 text-sm font-medium hover:bg-custom9 transition disabled:opacity-50"
            data-testid="tombol-batal-hapus"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onKonfirmasi(kataSandi)}
            disabled={sedangProses || (!pakaiGoogle && kataSandi === "")}
            className="px-4 py-2 rounded-full bg-[#A03030] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            data-testid="tombol-konfirmasi-hapus"
          >
            {sedangProses ? "Menghapus..." : "Ya, hapus akun"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Jendela konfirmasi identitas sebelum e-mail atau kata sandi diubah.
function DialogKonfirmasi({ provider, sedangProses, galat, onBatal, onKonfirmasi }) {
  const [kataSandi, setKataSandi] = useState("");
  const pakaiGoogle = provider === "google";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-konfirmasi"
      data-testid="dialog-konfirmasi"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="judul-konfirmasi" className="text-lg font-bold text-custom2">
          Konfirmasi identitas
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          {pakaiGoogle
            ? "Demi keamanan, kamu akan diminta masuk dengan Google sekali lagi untuk menyimpan perubahan."
            : "Demi keamanan, masukkan kata sandimu saat ini untuk menyimpan perubahan e-mail atau kata sandi."}
        </p>

        {!pakaiGoogle && (
          <div className="mt-4">
            <Isian
              id="kata-sandi-saat-ini"
              label="Kata sandi saat ini"
              type="password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}

        {galat && (
          <p className="mt-3 text-sm text-custom4" role="alert" data-testid="galat-konfirmasi">
            {galat}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBatal}
            disabled={sedangProses}
            className="px-4 py-2 rounded-full border border-custom1 text-custom1 text-sm font-medium hover:bg-custom9 transition disabled:opacity-50"
            data-testid="tombol-batal-konfirmasi"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onKonfirmasi(kataSandi)}
            disabled={sedangProses || (!pakaiGoogle && kataSandi === "")}
            className="px-4 py-2 rounded-full bg-gradient-to-b from-[#3E9B63] to-[#177B49] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            data-testid="tombol-konfirmasi-identitas"
          >
            {sedangProses ? "Memeriksa..." : pakaiGoogle ? "Lanjut dengan Google" : "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PengaturanAkun() {
  const navigate = useNavigate();
  const [akun, setAkun] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galatMuat, setGalatMuat] = useState("");

  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");

  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState(null); 

  const [dialogKonfirmasi, setDialogKonfirmasi] = useState(false);
  const [perubahanTertunda, setPerubahanTertunda] = useState(null);
  const [mengonfirmasi, setMengonfirmasi] = useState(false);
  const [galatKonfirmasi, setGalatKonfirmasi] = useState("");

  const [dialogHapus, setDialogHapus] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState("");

  const isiForm = (data) => {
    setNama(data.nama || "");
    setUsername(data.username || "");
    setEmail(data.email || "");
    setKataSandi("");
  };

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalatMuat("");
    try {
      const data = await ambilAkun();
      setAkun(data);
      isiForm(data);
    } catch (e) {
      if (e?.status === 401) {
        navigate("/auth/login", { replace: true });
        return;
      }
      setGalatMuat(e?.message || "Gagal memuat data akun.");
    } finally {
      setMemuat(false);
    }
  }, [navigate]);

  useEffect(() => {
    muat();
  }, [muat]);

  const akunGoogle = akun?.provider === "google";

  const simpan = async (e) => {
    e.preventDefault();
    if (!akun || menyimpan) return;
    setPesan(null);

    const perubahan = {};
    const namaBersih = nama.trim();
    const usernameBersih = username.trim();
    const emailBersih = email.trim();

    if (namaBersih === "") return setPesan({ jenis: "galat", teks: "Nama tidak boleh kosong." });
    if (usernameBersih === "") return setPesan({ jenis: "galat", teks: "Username tidak boleh kosong." });

    if (namaBersih !== (akun.nama || "")) perubahan.nama = namaBersih;
    if (usernameBersih !== (akun.username || "")) perubahan.username = usernameBersih;

    // E-mail akun Google dikunci; kata sandi boleh dibuat atau diubah oleh semua akun (FR-03).
    if (!akunGoogle && emailBersih !== (akun.email || "")) {
      if (!FORMAT_EMAIL.test(emailBersih)) {
        return setPesan({ jenis: "galat", teks: "Format e-mail tidak valid." });
      }
      perubahan.email = emailBersih;
    }
    if (kataSandi !== "") {
      if (kataSandi.length < 6) {
        return setPesan({ jenis: "galat", teks: "Kata sandi minimal 6 karakter." });
      }
      perubahan.password = kataSandi;
    }

    if (Object.keys(perubahan).length === 0) {
      return setPesan({ jenis: "galat", teks: "Belum ada perubahan untuk disimpan." });
    }

    // Mengubah e-mail atau kata sandi wajib didahului konfirmasi identitas.
    if (perubahan.email !== undefined || perubahan.password !== undefined) {
      setGalatKonfirmasi("");
      setPerubahanTertunda(perubahan);
      setDialogKonfirmasi(true);
      return;
    }

    await terapkanPerubahan(perubahan);
  };

  const terapkanPerubahan = async (perubahan) => {
    setMenyimpan(true);
    try {
      const terbaru = await ubahAkun(perubahan);
      setAkun(terbaru);
      isiForm(terbaru);

      const kredensialBerubah = perubahan.email !== undefined || perubahan.password !== undefined;
      if (kredensialBerubah) {
        // Server mencabut sesi lama saat e-mail atau kata sandi berubah.
        const sesiMasihAda = await segarkanSesi();
        if (!sesiMasihAda) {
          navigate("/auth/login", { replace: true });
          await keluar();
          return;
        }
      }
      setPesan({ jenis: "sukses", teks: "Perubahan berhasil disimpan." });
    } catch (err) {
      if (err?.status === 401) {
        navigate("/auth/login", { replace: true });
        return;
      }
      setPesan({ jenis: "galat", teks: err?.message || "Gagal menyimpan perubahan." });
    } finally {
      setMenyimpan(false);
    }
  };

  const konfirmasiUbah = async (kataSandiKonfirmasi) => {
    if (!akun || !perubahanTertunda || mengonfirmasi) return;
    setGalatKonfirmasi("");
    setMengonfirmasi(true);
    try {
      await konfirmasiIdentitas({
        provider: akun.provider,
        email: akun.email,
        kataSandi: kataSandiKonfirmasi,
      });
    } catch (err) {
      setGalatKonfirmasi(err?.message || "Konfirmasi identitas gagal.");
      setMengonfirmasi(false);
      return;
    }
    const perubahan = perubahanTertunda;
    setDialogKonfirmasi(false);
    setPerubahanTertunda(null);
    setMengonfirmasi(false);
    await terapkanPerubahan(perubahan);
  };

  const konfirmasiHapus = async (kataSandiKonfirmasi) => {
    if (!akun || menghapus) return;
    setGalatHapus("");
    setMenghapus(true);
    try {
      await konfirmasiIdentitas({
        provider: akun.provider,
        email: akun.email,
        kataSandi: kataSandiKonfirmasi,
      });
      await hapusAkun();
      // Pindah dulu supaya penjaga halaman tidak mengalihkan ke login saat status login berubah.
      navigate("/", { replace: true });
      await keluar().catch(() => {});
    } catch (err) {
      setGalatHapus(err?.message || "Gagal menghapus akun.");
      setMenghapus(false);
    }
  };

  return (
    <div className="min-h-screen bg-custom-radial font-poppins pb-16">
      <nav className="flex items-center w-full px-6 pt-8 md:px-12 md:pt-10">
        <Link to="/dashboard-batak" className="logo font-irish m-0 text-2xl hover:opacity-80 transition">
          dialek.id
        </Link>
      </nav>

      <div className="relative w-full max-w-2xl mx-auto px-6 mt-2 flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate("/profil")}
          aria-label="Kembali ke profil"
          className="absolute left-6 w-9 h-9 rounded-full bg-custom1 text-white flex items-center justify-center hover:opacity-80 transition"
          data-testid="tombol-kembali"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-custom2">Pengaturan</h1>
      </div>

      <main className="w-full max-w-2xl mx-auto px-6 mt-6">
        {memuat && (
          <p className="text-center text-custom2 mt-10" data-testid="memuat">
            Memuat data akun...
          </p>
        )}

        {!memuat && galatMuat && (
          <div className="mt-10 p-6 rounded-3xl bg-white/50 text-center text-custom2" role="alert" data-testid="galat-muat">
            <p>{galatMuat}</p>
            <button type="button" onClick={muat} className="button-custom mt-4 px-6 py-2">
              Coba lagi
            </button>
          </div>
        )}

        {!memuat && akun && (
          <form
            onSubmit={simpan}
            noValidate
            className="rounded-3xl bg-[#C9DCD2] p-6 md:p-8 flex flex-col items-center gap-6"
            data-testid="form-akun"
          >
            <Avatar nama={akun.nama || akun.username} />

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Isian id="nama" label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" />
              <Isian
                id="username"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <Isian
                id="email"
                label="Alamat E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={akunGoogle}
                autoComplete="email"
              />
              <Isian
                id="kata-sandi"
                label="Kata Sandi"
                type="password"
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                placeholder={akunGoogle ? "Buat kata sandi untuk login dengan e-mail" : "Kosongkan bila tidak diubah"}
                autoComplete="new-password"
              />
            </div>

            {akunGoogle && (
              <p className="w-full text-xs text-custom2" data-testid="catatan-google">
                Akun terdaftar melalui Google, jadi e-mail mengikuti akun Google dan tidak dapat diubah. Kamu tetap bisa masuk dengan Google. Mengisi kata sandi di sini menambahkan opsi masuk dengan e-mail Google tersebut dan kata sandi.
              </p>
            )}

            {pesan && (
              <p
                className={`w-full text-sm ${pesan.jenis === "sukses" ? "text-custom1" : "text-custom4"}`}
                role={pesan.jenis === "sukses" ? "status" : "alert"}
                data-testid={pesan.jenis === "sukses" ? "pesan-sukses" : "pesan-galat"}
              >
                {pesan.teks}
              </p>
            )}

            <div className="w-full flex justify-end gap-3">
              <button
                type="submit"
                disabled={menyimpan}
                className="px-6 py-2 rounded-full bg-gradient-to-b from-[#3E9B63] to-[#177B49] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                data-testid="tombol-simpan"
              >
                {menyimpan ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGalatHapus("");
                  setDialogHapus(true);
                }}
                className="px-6 py-2 rounded-full bg-[#A03030] text-white text-sm font-semibold hover:opacity-90 transition"
                data-testid="tombol-hapus-akun"
              >
                Hapus Akun
              </button>
            </div>
          </form>
        )}
      </main>

      {dialogKonfirmasi && akun && (
        <DialogKonfirmasi
          provider={akun.provider}
          sedangProses={mengonfirmasi}
          galat={galatKonfirmasi}
          onBatal={() => {
            setDialogKonfirmasi(false);
            setPerubahanTertunda(null);
          }}
          onKonfirmasi={konfirmasiUbah}
        />
      )}

      {dialogHapus && akun && (
        <DialogHapus
          provider={akun.provider}
          sedangProses={menghapus}
          galat={galatHapus}
          onBatal={() => setDialogHapus(false)}
          onKonfirmasi={konfirmasiHapus}
        />
      )}
    </div>
  );
}
