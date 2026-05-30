import { useState } from "react";
import API from "../../api/api";
import { 
  Bell, 
  Lock, 
  Palette, 
  Database, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  X 
} from "lucide-react";

export default function Pengaturan() {
  const user = JSON.parse(
    localStorage.getItem("sipb_admin_user") ||
    sessionStorage.getItem("sipb_admin_user") ||
    "{}"
  );

  const [formProfil, setFormProfil] = useState({
    nama: user.nama || "",
    email: user.email || "",
    telepon: user.telepon || "",
  });

  const [submittingProfil, setSubmittingProfil] = useState(false);

  // Keamanan States
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassLama, setShowPassLama] = useState(false);
  const [showPassBaru, setShowPassBaru] = useState(false);
  const [showPassKonfirm, setShowPassKonfirm] = useState(false);


  // General States
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success'|'error', text: '' }

  const showNotification = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  const handleProfilChange = (e) => {
    setFormProfil({
      ...formProfil,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilSubmit = async (e) => {
    e.preventDefault();
    if (!formProfil.nama || !formProfil.telepon) {
      showNotification("error", "Nama dan No. Telepon wajib diisi.");
      return;
    }

    setSubmittingProfil(true);
    try {
      const res = await API.put("/auth/profile", {
        nama: formProfil.nama.trim(),
        telepon: formProfil.telepon.trim(),
      });

      if (res.data.success) {
        showNotification("success", "Profil berhasil diperbarui!");
        const userLama = JSON.parse(
          localStorage.getItem("sipb_admin_user") ||
          sessionStorage.getItem("sipb_admin_user") ||
          "{}"
        );
        const userBaru = {
          ...userLama,
          nama: formProfil.nama.trim(),
          telepon: formProfil.telepon.trim(),
        };
        if (localStorage.getItem("sipb_admin_user")) {
          localStorage.setItem("sipb_admin_user", JSON.stringify(userBaru));
        } else {
          sessionStorage.setItem("sipb_admin_user", JSON.stringify(userBaru));
        }
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Gagal update profil:", err);
      showNotification("error", err.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setSubmittingProfil(false);
    }
  };

  // Change password handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      showNotification("error", "Semua kolom kata sandi wajib diisi!");
      return;
    }

    if (passwordBaru.length < 8) {
      showNotification("error", "Password baru minimal harus 8 karakter.");
      return;
    }

    // Dynamic password constraints regex (matches authController.js)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
    if (!passwordRegex.test(passwordBaru)) {
      showNotification(
        "error",
        "Password baru harus berisi minimal 1 huruf besar, 1 huruf kecil, dan 1 angka."
      );
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      showNotification("error", "Konfirmasi password baru tidak cocok!");
      return;
    }

    if (passwordLama === passwordBaru) {
      showNotification("error", "Password baru tidak boleh sama dengan password lama.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.put("/auth/password", {
        password_lama: passwordLama,
        password_baru: passwordBaru,
      });

      if (res.data.success) {
        showNotification("success", "Password berhasil diubah!");
        setPasswordLama("");
        setPasswordBaru("");
        setKonfirmasiPassword("");
      }
    } catch (err) {
      console.error("Gagal ganti password:", err);
      showNotification(
        "error",
        err.response?.data?.message || "Gagal mengubah password. Pastikan password lama Anda benar."
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div style={{ padding: "4px 0", maxWidth: 1200, margin: "0 auto" }}>
      
      {/* Toast Alert */}
      {alertMsg && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            background: alertMsg.type === "success" ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${alertMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 12,
            padding: "16px 20px",
            color: alertMsg.type === "success" ? "#15803d" : "#b91c1c",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 380,
          }}
        >
          {alertMsg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{alertMsg.text}</span>
          <button
            onClick={() => setAlertMsg(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginLeft: "auto",
              color: alertMsg.type === "success" ? "#166534" : "#991b1b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
          Pengaturan
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* CARD 1: INFORMASI PRIBADI */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #eef2f7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>Informasi Pribadi</h3>
          </div>
          
          <form onSubmit={handleProfilSubmit} style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr", gap: 16, maxWidth: 420 }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Nama Lengkap</label>
              <input
                type="text"
                name="nama"
                required
                value={formProfil.nama}
                onChange={handleProfilChange}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  padding: "9px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Email</label>
              <input
                type="email"
                name="email"
                disabled
                value={formProfil.email}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  padding: "9px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "#f8fafc",
                  color: "#94a3b8",
                  cursor: "not-allowed",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>No. Telepon</label>
              <input
                type="text"
                name="telepon"
                required
                value={formProfil.telepon}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d+]/g, "");
                  setFormProfil({ ...formProfil, telepon: value });
                }}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  padding: "9px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submittingProfil}
              style={{
                width: "max-content",
                marginTop: 4,
                background: "#1e293b",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: submittingProfil ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseOver={e => { if(!submittingProfil) e.currentTarget.style.background = "#0f172a"; }}
              onMouseOut={e => { if(!submittingProfil) e.currentTarget.style.background = "#1e293b"; }}
            >
              <Save size={14} />
              {submittingProfil ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </div>

        {/* CARD 2: KEAMANAN */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #eef2f7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>Keamanan</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr", gap: 16, maxWidth: 420 }}>
            
            {/* Password Sekarang */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Kata Sandi Sekarang</label>
              <div style={{ position: "relative" }}>
                <input
                  className="password-input"
                  type={showPassLama ? "text" : "password"}
                  required
                  placeholder="Masukkan kata sandi lama"
                  value={passwordLama}
                  onChange={(e) => setPasswordLama(e.target.value)}
                  style={{
                    boxSizing: "border-box",
                    width: "100%",
                    padding: "9px 42px 9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassLama(!showPassLama)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassLama ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Password Baru</label>
              <div style={{ position: "relative" }}>
                <input
                  className="password-input"
                  type={showPassBaru ? "text" : "password"}
                  required
                  placeholder="Masukkan kata sandi baru"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  style={{
                    boxSizing: "border-box",
                    width: "100%",
                    padding: "9px 42px 9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassBaru(!showPassBaru)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassBaru ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Konfirmasi</label>
              <div style={{ position: "relative" }}>
                <input
                  className="password-input"
                  type={showPassKonfirm ? "text" : "password"}
                  required
                  placeholder="Konfirmasi kata sandi baru"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  style={{
                    boxSizing: "border-box",
                    width: "100%",
                    padding: "9px 42px 9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassKonfirm(!showPassKonfirm)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassKonfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "max-content",
                marginTop: 4,
                background: "#1e293b",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseOver={e => { if(!submitting) e.currentTarget.style.background = "#0f172a"; }}
              onMouseOut={e => { if(!submitting) e.currentTarget.style.background = "#1e293b"; }}
            >
              <Save size={14} />
              {submitting ? "Menyimpan..." : "Simpan Password"}
            </button>

          </form>
        </div>


      </div>
    </div>
  );
}