import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Materi from './pages/Materi';
import LatihanKosakata from './pages/LatihanKosakata';
import Permainan from './pages/Permainan';
import ForumDiskusi from './pages/ForumDiskusi';
import LiterasiBudaya from './pages/LiterasiBudaya';

const ProtectedRoute = ({ children }) => {
  // TODO: Ini akan dihubungkan dengan state Firebase Auth nanti
  const isAuthenticated = true; // Set true sementara biar bisa melihat halamannya
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute Terproteksi (Wajib Login) */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/materi" 
          element={<ProtectedRoute><Materi /></ProtectedRoute>} 
        />
        <Route 
          path="/kosakata" 
          element={<ProtectedRoute><LatihanKosakata /></ProtectedRoute>} 
        />
        <Route 
          path="/permainan" 
          element={<ProtectedRoute><Permainan /></ProtectedRoute>} 
        />
        <Route 
          path="/forum" 
          element={<ProtectedRoute><ForumDiskusi /></ProtectedRoute>} 
        />
        <Route 
          path="/literasi-budaya" 
          element={<ProtectedRoute><LiterasiBudaya /></ProtectedRoute>} 
        />
      </Routes>
    </BrowserRouter>
  );
}