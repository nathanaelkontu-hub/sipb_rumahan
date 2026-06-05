import { useEffect, useState } from "react";
import API from "../../api/api";

// Komponen Halaman Beranda (Pelanggan) yang menampilkan ringkasan pesanan aktif dan riwayat singkat
function Beranda() {
  const [pesanan, setPesanan] = useState([]);

  useEffect(() => {
    async function loadPesanan() {
      try {
        const res = await API.get("/pelanggan/pesanan");

        if (res.data.success) {
          setPesanan(res.data.data || []);
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadPesanan();
  }, []);

  // Menghitung jumlah pesanan berdasarkan status untuk ditampilkan di kartu statistik
  const aktif = pesanan.filter((p) => p.status !== "selesai").length;
  const pending = pesanan.filter((p) => p.status === "pending" || p.status === "verifikasi").length;
  const selesai = pesanan.filter((p) => p.status === "selesai").length;

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
          Selamat Datang di
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
          Order Barang
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 28 }}>
        <StatCard icon="📦" title="Total Pesanan Aktif" value={aktif} />
        <StatCard icon="🕒" title="Pembayaran Tertunda" value={pending} />
        <StatCard icon="✅" title="Selesai" value={selesai} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {pesanan.length === 0 ? (
          <div style={styles.card}>Belum ada pesanan</div>
        ) : (
          pesanan.map((item) => (
            <div key={item.id_pesanan} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                    {item.nama_barang || "Pesanan Custom"}
                  </h3>
                  <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                    Tagihan: {Number(item.total_harga || 0) > 0 ? formatRupiah(item.total_harga) : "Menunggu Konfirmasi"}
                  </p>
                </div>

                <strong>{item.kode_pesanan || "ORD"}</strong>
              </div>

              <ProgressStatus status={item.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.icon}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{value}</div>
    </div>
  );
}

function ProgressStatus({ status }) {
  const steps = ["Permintaan", "Koordinasi", "Pembayaran DP", "Pembelian", "Selesai"];

  function activeStep() {
    if (status === "pending") return 1;
    if (status === "verifikasi") return 2;
    if (status === "diproses") return 4;
    if (status === "selesai") return 5;
    return 1;
  }

  const current = activeStep();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
      {steps.map((step, index) => {
        const nomor = index + 1;
        const done = nomor <= current;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: index === steps.length - 1 ? 0 : 1 }}>
            <div style={{ textAlign: "center", minWidth: 100 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "999px",
                  background: done ? "#1d4f7a" : "#e2e8f0",
                  border: done ? "4px solid #dbeafe" : "4px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 22,
                  margin: "0 auto 10px",
                }}
              >
                {nomor === 1 ? "📦" : nomor === 2 ? "🕒" : nomor === 3 ? "📈" : nomor === 4 ? "📦" : "✅"}
              </div>
              <div style={{ fontSize: 13, color: "#1e3a5f" }}>{step}</div>
            </div>

            {index < steps.length - 1 && (
              <div
                style={{
                  height: 3,
                  flex: 1,
                  background: nomor < current ? "#1d4f7a" : "#cbd5e1",
                  margin: "0 -6px 28px",
                  borderRadius: 999,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatRupiah(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

const styles = {
  card: {
    background: "white",
    borderRadius: 20,
    padding: 24,
    border: "1px solid #eef2f7",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  icon: {
    width: 46,
    height: 46,
    background: "#f1f5f9",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    fontSize: 22,
  },
};

export default Beranda;