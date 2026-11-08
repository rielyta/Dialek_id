import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { loginEmail, loginGoogle, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginEmail(formData.email, formData.password);
  };

  return (
    <div className="flex flex-col min-h-screen bg-green-50 font-sans">
      <nav className="flex items-center justify-between w-full p-8 md:p-12">
        <Link to="/" className="text-2xl font-bold text-green-800 cursor-pointer">dialek.id</Link>
      </nav>

      <section className="flex flex-col flex-grow w-full max-w-lg mx-auto px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg mb-10">
          <h2 className="text-4xl font-bold text-center text-green-700 mb-8">Masuk</h2>
          
          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-lg font-semibold mb-2">E-mail</label>
              <div className="relative flex items-center bg-gray-100 border border-gray-300 rounded-lg">
                <svg className="w-5 h-5 absolute left-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                <input type="email" name="email" placeholder="nama@domain.com" required onChange={handleChange}
                  className="w-full bg-transparent pl-10 pr-4 py-3 outline-none rounded-lg text-sm" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-gray-700 text-lg font-semibold mb-2">Kata Sandi</label>
              <div className="relative flex items-center bg-gray-100 border border-gray-300 rounded-lg">
                <svg className="w-5 h-5 absolute left-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                <input type="password" name="password" placeholder="*" required onChange={handleChange}
                  className="w-full bg-transparent pl-10 pr-4 py-3 outline-none rounded-lg text-sm" />
              </div>
            </div>

            <div className="text-center">
              <button type="submit" disabled={loading}
                className="w-40 py-3 text-lg font-bold text-white bg-green-700 rounded-lg hover:bg-green-800 transition">
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </div>

            <div className="my-6 flex items-center">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-4 text-gray-500 text-sm">atau</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <div className="flex flex-col space-y-3">
              <button type="button" onClick={loginGoogle} disabled={loading}
                className="flex justify-center items-center w-full py-3 border border-green-600 rounded-full text-green-700 hover:bg-green-50 transition">
                Masuk dengan akun Google
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-700">
                Belum Punya Akun? <Link to="/register" className="font-bold text-green-700 hover:underline">Daftar</Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}