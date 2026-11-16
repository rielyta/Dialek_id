import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getFriendlyErrorMessage(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail atau kata sandi salah.";
    case "auth/email-already-in-use":
      return "E-mail sudah terdaftar. Silakan masuk.";
    case "auth/weak-password":
      return "Kata sandi minimal 6 karakter.";
    case "auth/invalid-email":
      return "Format e-mail tidak valid.";
    case "auth/popup-closed-by-user":
      return "Jendela masuk ditutup sebelum proses selesai.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Periksa jaringanmu.";
    default:
      return error?.message || "Terjadi kesalahan saat autentikasi.";
  }
}

function generateUsername(nama, email, suffix = "") {
  const baseSource = nama || (email ? email.split("@")[0] : "pengguna");
  const cleanBase =
    baseSource
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "pengguna";

  return suffix ? `${cleanBase}_${suffix}` : cleanBase;
}

async function fetchBackendProfile(token) {
  const res = await fetch(`${API_BASE_URL}/api/akun`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 404) {
    return null;
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Gagal mengambil data profil dari server.");
  }

  return payload.data;
}

async function createBackendProfile(token, nama, email, customUsername = "") {
  let attempt = 0;

  while (attempt < 4) {
    const suffix = attempt === 0 ? "" : Math.floor(100 + Math.random() * 900);
    const username =
      customUsername && attempt === 0
        ? customUsername
        : generateUsername(nama, email, suffix);

    const res = await fetch(`${API_BASE_URL}/api/akun`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        nama: nama || email?.split("@")[0] || "Pengguna Dialek.id",
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (res.ok) {
      return payload.data;
    }

    if (res.status === 409) {
      const msg = (payload.message || "").toLowerCase();
      if (msg.includes("profil")) {
        return fetchBackendProfile(token);
      }
      attempt += 1;
      continue;
    }

    throw new Error(payload.message || "Gagal membuat profil pengguna di server.");
  }

  throw new Error("Gagal membuat username unik. Silakan coba lagi.");
}

async function syncUserWithBackend(firebaseUser, extra = {}) {
  const token = await firebaseUser.getIdToken();

  const existingProfile = await fetchBackendProfile(token);
  if (existingProfile) {
    return existingProfile;
  }

  const nama =
    extra.nama ||
    firebaseUser.displayName ||
    firebaseUser.email?.split("@")[0] ||
    "Pengguna Dialek.id";

  return createBackendProfile(token, nama, firebaseUser.email, extra.username);
}

export async function loginManual({ email, password }) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await syncUserWithBackend(credential.user);
    return { success: true, user: credential.user, profile };
  } catch (error) {
    return { success: false, message: getFriendlyErrorMessage(error) };
  }
}

export async function registerManual({ nama, email, password, username }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (nama) {
      await updateProfile(credential.user, { displayName: nama });
    }

    const profile = await syncUserWithBackend(credential.user, { nama, username });
    return { success: true, user: credential.user, profile };
  } catch (error) {
    return { success: false, message: getFriendlyErrorMessage(error) };
  }
}

export async function authWithSocial(providerName) {
  try {
    const provider =
      providerName === "facebook" ? facebookProvider : googleProvider;

    const credential = await signInWithPopup(auth, provider);
    const profile = await syncUserWithBackend(credential.user);
    return { success: true, user: credential.user, profile };
  } catch (error) {
    return { success: false, message: getFriendlyErrorMessage(error) };
  }
}

export async function logout() {
  await signOut(auth);
}