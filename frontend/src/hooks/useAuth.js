import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '../service/firebase';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fungsi pembantu untuk mengambil ID Token dan mengirim ke Backend Express
  const syncWithBackend = async (user, additionalData = {}) => {
    const idToken = await user.getIdToken();
    
    // Ganti endpoint ini sesuai dengan route register/login di Express API Anda
    const response = await fetch("http://localhost:3000/api/akun", {
      method: "POST", // Sesuaikan method dengan API Contract Anda
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email: user.email,
        name: user.displayName || additionalData.name || "User",
        username: additionalData.username || null,
        profile_image: user.photoURL || "default_profile_image_url"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal sinkronisasi dengan server");
    return data;
  };

  const registerEmail = async (email, password, name, username) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await syncWithBackend(userCredential.user, { name, username });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Untuk login, Anda mungkin hanya perlu verifikasi token, tidak perlu POST data baru
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithBackend(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { registerEmail, loginEmail, loginGoogle, loading, error };
};