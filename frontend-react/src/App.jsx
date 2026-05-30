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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pesanan" element={<DaftarPesanan />} />
          <Route path="pelanggan" element={<DaftarPelanggan />} />
          <Route path="laporan" element={<LaporanKeuangan />} />
          <Route path="koordinasi" element={<KoordinasiHarga />} />
          <Route path="manajemen-user" element={<ManajemenUser />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>

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

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;