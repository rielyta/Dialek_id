import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h1 className="text-4xl font-bold text-green-700 mb-4">Dialek.id</h1>
      <p className="mb-8">Belajar Bahasa Batak Toba dengan Menyenangkan</p>
      <div className="space-x-4">
        <Link to="/login" className="px-6 py-2 bg-white text-green-700 border border-green-700 rounded-md">Masuk</Link>
        <Link to="/register" className="px-6 py-2 bg-green-700 text-white rounded-md">Daftar</Link>
      </div>
    </div>
  );
}