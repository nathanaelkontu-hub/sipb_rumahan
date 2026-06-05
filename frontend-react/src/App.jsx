import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminLayout from "./layouts/AdminLayout";
import PelangganLayout from "./layouts/PelangganLayout";

import Dashboard from "./pages/admin/Dashboard";
import DaftarPesanan from "./pages/admin/DaftarPesanan";
import DaftarPelanggan from "./pages/admin/DaftarPelanggan";
import LaporanKeuangan from "./pages/admin/LaporanKeuangan";
import KoordinasiHarga from "./pages/admin/KoordinasiHarga";
import ManajemenUser from "./pages/admin/ManajemenUser";
import Pengaturan from "./pages/admin/Pengaturan";

import Beranda from "./pages/pelanggan/Beranda";
import PesananSaya from "./pages/pelanggan/PesananSaya";
import RiwayatTransaksi from "./pages/pelanggan/RiwayatTransaksi";
import ProfilSaya from "./pages/pelanggan/ProfilSaya";
import ChatAdmin from "./pages/pelanggan/ChatAdmin";

// Komponen untuk mengatur rute-rute yang memiliki animasi transisi
function AnimatedRoutes() {
  // Hook untuk mendapatkan URL saat ini
  const location = useLocation();

  return (
    // AnimatePresence mendeteksi ketika komponen masuk/keluar dari DOM
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect root (/) otomatis ke /login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rute publik (bisa diakses tanpa login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute khusus Admin yang dibungkus oleh AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pesanan" element={<DaftarPesanan />} />
          <Route path="pelanggan" element={<DaftarPelanggan />} />
          <Route path="laporan" element={<LaporanKeuangan />} />
          <Route path="koordinasi" element={<KoordinasiHarga />} />
          <Route path="manajemen-user" element={<ManajemenUser />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>

        {/* Rute khusus Pelanggan yang dibungkus oleh PelangganLayout */}
        <Route path="/pelanggan" element={<PelangganLayout />}>
          <Route path="beranda" element={<Beranda />} />
          <Route path="pesanan-saya" element={<PesananSaya />} />
          <Route path="riwayat" element={<RiwayatTransaksi />} />
          <Route path="profil" element={<ProfilSaya />} />
          <Route path="chat" element={<ChatAdmin />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

// Komponen Induk Aplikasi
function App() {
  return (
    // Membungkus seluruh aplikasi dengan BrowserRouter agar fitur routing (URL) berfungsi
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;