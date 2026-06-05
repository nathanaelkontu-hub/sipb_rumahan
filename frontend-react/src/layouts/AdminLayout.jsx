import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import getImageUrl from "../utils/imageUrl";

// Komponen Layout Utama untuk Halaman Admin
function AdminLayout() {
  const navigate = useNavigate();
  // Mengambil data user admin dari localStorage atau sessionStorage
  const user = JSON.parse(
  localStorage.getItem("sipb_admin_user") ||
  sessionStorage.getItem("sipb_admin_user") ||
  "{}"
);

  // Fungsi untuk logout (menghapus token dan sesi admin lalu kembali ke halaman login)
  const logout = () => {
    localStorage.removeItem("sipb_admin_token");
    localStorage.removeItem("sipb_admin_user");
    sessionStorage.removeItem("sipb_admin_token");
    sessionStorage.removeItem("sipb_admin_user");
    navigate("/login");
  };

  // Daftar menu yang akan ditampilkan di Sidebar Admin
  const menus = [
    { to: "/admin/dashboard", label: "Beranda" },
    { to: "/admin/pesanan", label: "Daftar Pesanan" },
    { to: "/admin/pelanggan", label: "Daftar Pelanggan" },
    { to: "/admin/laporan", label: "Laporan Keuangan" },
    { to: "/admin/koordinasi", label: "Koordinasi Harga" },
    { to: "/admin/manajemen-user", label: "Manajemen Pengguna" },
    { to: "/admin/pengaturan", label: "Pengaturan" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Bagian Header / Topbar */}
      <header style={{
        height: 72,
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Menambahkan space-between
        padding: "0 32px",
        gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#f0fdf4", // Soft green background for Admin
            color: "#16a34a", // Primary green color
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
            boxShadow: "0 2px 4px rgba(22, 163, 74, 0.1)"
          }}>
            {user.foto_profil ? (
              <img src={getImageUrl(user.foto_profil)} alt="Profil" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              (user.nama || "A").charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Administrator</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{user.nama || "Nama Admin"}</span>
          </div>
        </div>


      </header>

      {/* Bagian Utama: Sidebar dan Konten */}
      <div style={{ display: "flex" }}>
        {/* Sidebar Navigasi Admin */}
        <aside style={{ width: 240, minHeight: "calc(100vh - 72px)", background: "white", borderRight: "1px solid #f1f5f9", padding: 16, display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 24 }}>SIPB</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {menus.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              style={({ isActive }) => ({
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: isActive ? "white" : "#64748b",
                background: isActive ? "#1e293b" : "transparent",
                fontSize: 14,
                fontWeight: 600,
              })}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} style={{ marginTop: "auto", border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 600, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Keluar
        </button>
      </aside>

      {/* Area Konten Utama dimana halaman spesifik akan dirender (menggunakan Outlet) */}
      <main style={{ flex: 1, padding: 28 }}>
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    <Outlet />
  </motion.div>
</main>
      </div>
    </div>
  );
}

export default AdminLayout;