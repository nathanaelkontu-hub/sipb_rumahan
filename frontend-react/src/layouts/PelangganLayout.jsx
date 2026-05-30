import { motion } from "framer-motion";
import berandaIcon from "../assets/icons/beranda.svg";
import pesananIcon from "../assets/icons/pesanan-saya.svg";
import riwayatIcon from "../assets/icons/riwayat-transaksi.svg";
import profilIcon from "../assets/icons/profil-saya.svg";
import chatIcon from "../assets/icons/chat-admin.svg";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function PelangganLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(
  localStorage.getItem("sipb_pelanggan_user") ||
  sessionStorage.getItem("sipb_pelanggan_user") ||
  "{}"
);

  const logout = () => {
    localStorage.removeItem("sipb_pelanggan_token");
    localStorage.removeItem("sipb_pelanggan_user");
    sessionStorage.removeItem("sipb_pelanggan_token");
    sessionStorage.removeItem("sipb_pelanggan_user");
    navigate("/login");
  };

  const menus = [
    { to: "/pelanggan/beranda", icon: berandaIcon, label: "Beranda" },
    { to: "/pelanggan/pesanan-saya", icon: pesananIcon, label: "Pesanan Saya" },
    { to: "/pelanggan/riwayat", icon: riwayatIcon, label: "Riwayat Transaksi" },
    { to: "/pelanggan/profil", icon: profilIcon, label: "Profil Saya" },
    { to: "/pelanggan/chat", icon: chatIcon, label: "Chat Admin" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F6F9FC" }}>
      <header style={{ ...styles.topbar, justifyContent: "space-between" }}>
        {/* Kiri: Info Profil */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#eff6ff", // Soft blue background
            color: "#2563eb", // Primary blue color
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)"
          }}>
            {user.foto_profil ? (
              <img src={`http://localhost:3000/uploads/${user.foto_profil}`} alt="Profil" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              (user.nama || "P").charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Pelanggan</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{user.nama || "Nama Pelanggan"}</span>
          </div>
        </div>


      </header>

      <div style={{ display: "flex" }}>
        <aside style={styles.sidebar}>
          <div style={{ marginBottom: 16 }}></div>

          {menus.map((m) => (
  <NavLink
    key={m.to}
    to={m.to}
    style={({ isActive }) => ({
      ...styles.navItem,
      background: isActive ? "#073B63" : "transparent",
      color: isActive ? "white" : "#334155",
      boxShadow: isActive ? "0 6px 14px rgba(7, 59, 99, 0.24)" : "none",
    })}
  >
    {({ isActive }) => (
      <>
        <img
          src={m.icon}
          alt={m.label}
          style={{
            width: 22,
            height: 22,
            filter: isActive ? "brightness(0) invert(1)" : "none",
          }}
        />
        <span>{m.label}</span>
      </>
    )}
  </NavLink>
))}

          <button onClick={logout} style={styles.logout}>
            Keluar
          </button>
        </aside>

        <main style={styles.content}>
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

const styles = {
  topbar: {
    height: 72,
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    padding: "0 32px",
    gap: 20,
  },
  sidebar: {
    width: 320,
    height: "calc(100vh - 72px)",
    position: "fixed",
    top: 72,
    left: 0,
    background: "white",
    borderRight: "1px solid #E2E8F0",
    padding: 26,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  portalBox: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 34,
  },
  portalIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    background: "#073B63",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  },
  portalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: "#0F172A",
  },
  portalText: {
    margin: "4px 0 0",
    color: "#64748B",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  navItem: {
    height: 58,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px",
    textDecoration: "none",
    fontSize: 17,
    fontWeight: 700,
  },
  logout: {
    marginTop: "auto",
    border: "none",
    background: "#fef2f2",
    color: "#ef4444",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    height: 58,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 18px",
    fontSize: 17,
    width: "100%",
  },
    content: {
    flex: 1,
    marginLeft: 320,
    padding: "36px 40px",
    minHeight: "calc(100vh - 72px)",
  },
};

export default PelangganLayout;