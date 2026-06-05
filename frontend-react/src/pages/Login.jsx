import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/api";
import { motion } from "framer-motion";

// Komponen utama untuk Halaman Login
function Login() {
  // Hook untuk navigasi antar halaman
  const navigate = useNavigate();

  // Mengambil email yang tersimpan di localStorage (jika user sebelumnya mencentang "Remember me")
  const savedEmail = localStorage.getItem("remember_email") || "";

  // State untuk input form login
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(savedEmail));
  
  // State untuk pesan error dan visibilitas password
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fungsi yang dijalankan ketika tombol "Masuk" (form submit) ditekan
  async function handleLogin(e) {
    e.preventDefault(); // Mencegah reload halaman
    setError("");

    try {
      // Memanggil API login
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
  // Hapus semua token dan data sesi yang mungkin masih ada sebelum login baru
  localStorage.removeItem("sipb_token");
  localStorage.removeItem("sipb_user");
  sessionStorage.removeItem("sipb_token");
  sessionStorage.removeItem("sipb_user");

  // Jika yang login adalah admin
  if (res.data.user.role === "admin") {
    if (rememberMe) {
      localStorage.setItem("sipb_admin_token", res.data.token);
      localStorage.setItem("sipb_admin_user", JSON.stringify(res.data.user));
      localStorage.setItem("remember_email", email);
    } else {
      sessionStorage.setItem("sipb_admin_token", res.data.token);
      sessionStorage.setItem("sipb_admin_user", JSON.stringify(res.data.user));
      localStorage.removeItem("remember_email");
    }
  } else {
    if (rememberMe) {
      localStorage.setItem("sipb_pelanggan_token", res.data.token);
      localStorage.setItem("sipb_pelanggan_user", JSON.stringify(res.data.user));
      localStorage.setItem("remember_email", email);
    } else {
      sessionStorage.setItem("sipb_pelanggan_token", res.data.token);
      sessionStorage.setItem("sipb_pelanggan_user", JSON.stringify(res.data.user));
      localStorage.removeItem("remember_email");
    }
  }

  // Arahkan ke halaman dashboard (jika admin) atau beranda (jika pelanggan)
  if (res.data.user.role === "admin") {
    navigate("/admin/dashboard");
  } else {
    navigate("/pelanggan/beranda");
  }
}
    } catch (err) {
      // Tampilkan pesan error jika kredensial salah
      setError(err.response?.data?.message || "Login gagal");
    }
  }

  // Fungsi yang dipanggil ketika Login dengan Google berhasil
  async function handleGoogleSuccess(credentialResponse) {
    setError("");

    try {
      // Mengirim kredensial Google ke API backend
      const res = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      if (res.data.success) {
        if (res.data.user.role === "admin") {
          localStorage.setItem("sipb_admin_token", res.data.token);
          localStorage.setItem("sipb_admin_user", JSON.stringify(res.data.user));
          navigate("/admin/dashboard");
        } else {
          localStorage.setItem("sipb_pelanggan_token", res.data.token);
          localStorage.setItem("sipb_pelanggan_user", JSON.stringify(res.data.user));
          navigate("/pelanggan/beranda");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login Google gagal");
    }
  }

  // Mengembalikan antarmuka UI halaman login
  return (
    <motion.div
    style={styles.page}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
        <div style={styles.left}>
          <div style={styles.topLink}>
            Belum punya akun?
            <button onClick={() => navigate("/register")} style={styles.smallBtn}>
              Daftar
            </button>
          </div>

          <div style={styles.formBox}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>▣</div>
              <strong>SIPB Rumahan</strong>
            </div>

            <h1 style={styles.title}>Selamat Datang!</h1>
            <p style={styles.subtitle}>Masuk ke akun SIPB kamu</p>

            <form onSubmit={handleLogin}>
              <label style={styles.label}>Email:</label>
              <input
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
              />

              <label style={styles.label}>Kata Sandi:</label>
              <div style={styles.passwordWrap}>
  <input
    style={styles.passwordInput}
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Masukkan kata sandi"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={styles.eyeBtn}
  >
    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
  </button>
</div>

              <div style={styles.remember}>
                <label style={styles.rememberLabel}>
                  <input
  type="checkbox"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
/>
                  Ingat saya
                </label>
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" style={styles.primaryBtn}>
                Masuk
              </button>
            </form>

            <div style={styles.googleBox}>
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => setError("Login Google gagal")}
    theme="outline"
    size="large"
    shape="pill"
    text="signin_with"
    locale="id"
    width="360"
  />
</div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.shapeOne}></div>
          <div style={styles.shapeTwo}></div>
          <div style={styles.shapeThree}></div>
          <div style={styles.dotsOne}></div>
          <div style={styles.dotsTwo}></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles = {

  passwordWrap: {
  width: "100%",
  height: 46,
  border: "1.5px solid #e2e8f0",
  borderRadius: 999,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  marginBottom: 18,
  overflow: "hidden",
},

passwordInput: {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  padding: "0 18px",
  fontSize: 14,
},

eyeBtn: {
  width: 46,
  height: 46,
  border: "none",
  background: "transparent",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
},

  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f8df7, #0f4bd8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 1160,
    minHeight: 720,
    background: "white",
    borderRadius: 26,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "45% 55%",
    border: "6px solid rgba(255,255,255,0.75)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
  },
  left: {
    position: "relative",
    padding: "34px 56px",
    background: "white",
  },
  topLink: {
    position: "absolute",
    top: 24,
    right: 34,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    color: "#64748b",
  },
  smallBtn: {
    border: "2px solid #1687e8",
    background: "white",
    color: "#1687e8",
    borderRadius: 999,
    padding: "8px 22px",
    fontWeight: 800,
    cursor: "pointer",
  },
  formBox: {
    maxWidth: 360,
    margin: "140px auto 0",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    color: "#0f172a",
  },
  logoIcon: {
    width: 30,
    height: 30,
    border: "2px solid #0f172a",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    fontSize: 18,
  },
  title: {
    fontSize: 34,
    lineHeight: 1.1,
    margin: "0 0 8px",
    color: "#0f172a",
    fontWeight: 900,
  },
  subtitle: {
    color: "#64748b",
    margin: "0 0 26px",
    fontSize: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 7,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    height: 46,
    border: "1.5px solid #e2e8f0",
    borderRadius: 999,
    padding: "0 18px",
    outline: "none",
    marginBottom: 18,
    background: "#f8fafc",
    fontSize: 14,
  },
  remember: {
    display: "flex",
    alignItems: "center",
    marginBottom: 18,
  },
  rememberLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#334155",
  },
  primaryBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 999,
    background: "#0f83ed",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(15, 131, 237, 0.25)",
  },
  googleBox: {
  width: "100%",
  marginTop: 14,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
},
  error: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  right: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #0ea5e9, #0f4bd8)",
  },
  shapeOne: {
    position: "absolute",
    width: 560,
    height: 230,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    top: 40,
    right: -90,
    transform: "rotate(-10deg)",
  },
  shapeTwo: {
    position: "absolute",
    width: 600,
    height: 270,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    bottom: -70,
    left: 80,
    transform: "rotate(-12deg)",
  },
  shapeThree: {
    position: "absolute",
    width: 220,
    height: 220,
    border: "2px solid rgba(255,255,255,0.16)",
    transform: "rotate(45deg)",
    left: 30,
    top: 220,
  },
  dotsOne: {
    position: "absolute",
    width: 190,
    height: 130,
    top: 170,
    left: 80,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.36) 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },
  dotsTwo: {
    position: "absolute",
    width: 130,
    height: 100,
    bottom: 110,
    left: 95,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.32) 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },
};

export default Login;