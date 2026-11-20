import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ForumDiskusi from "./pages/ForumDiskusi";
import LatihanKosaKata from "./pages/LatihanKosaKata";
import LiterasiBudaya from "./pages/LiterasiBudaya";
import Materi from "./pages/Materi";
import Permainan from "./pages/Permainan";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Rute Autentikasi */}
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/register" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-batak" element={<Dashboard />} />
        <Route path="/forum-diskusi" element={<ForumDiskusi />} />
        <Route path="/latihan-kosakata" element={<LatihanKosaKata />} />
        <Route path="/literasi-budaya" element={<LiterasiBudaya />} />
        <Route path="/materi" element={<Materi />} />
        <Route path="/permainan" element={<Permainan />} />
      </Routes>
    </BrowserRouter>
  );
}