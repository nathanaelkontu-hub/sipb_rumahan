import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import API from "../../api/api";

// Komponen Halaman Riwayat Transaksi (Pelanggan) untuk melihat dan memfilter riwayat pesanan serta melakukan pembayaran
function RiwayatTransaksi() {
  const [riwayat, setRiwayat] = useState([]);
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [metode, setMetode] = useState("transfer");
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [buktiBayar, setBuktiBayar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await API.get("/pelanggan/riwayat");

        if (res.data.success) {
          setRiwayat(res.data.data || []);
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadData();
  }, []);

  // Filter riwayat berdasarkan status yang dipilih pada dropdown
  const dataFilter = status
    ? riwayat.filter((item) => item.status === status)
    : riwayat;

  const totalHarga = riwayat.reduce((total, item) => {
    return total + Number(item.total_harga || 0);
  }, 0);

  // Membuka modal detail untuk melihat informasi lengkap pesanan
  function lihatDetailRiwayat(item) {
    setDetail(item);
    setShowPayForm(false);
    setJumlahBayar(item.total_harga || "");
    setBuktiBayar(null);
  }

  // Mengunggah bukti pembayaran pelanggan ke server
  async function handleBayar(e) {
    e.preventDefault();
    if (!buktiBayar) {
      alert("Harap unggah bukti pembayaran");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("id_pesanan", detail.id_pesanan);
      formData.append("metode", metode);
      formData.append("jumlah_bayar", jumlahBayar || detail.total_harga);
      formData.append("bukti_bayar", buktiBayar);

      const res = await API.post("/pelanggan/pembayaran", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.");
        setShowPayForm(false);
        setDetail(null);
        const reload = await API.get("/pelanggan/riwayat");
        if (reload.data.success) {
          setRiwayat(reload.data.data || []);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengunggah pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <div style={{ marginTop: -14, marginBottom: 28 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          Riwayat Transaksi
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.top}>
          <div>
            <div style={styles.label}>Total Transaksi</div>
            <div style={styles.value}>{riwayat.length}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={styles.label}>Total Tagihan</div>
            <div style={styles.value}>
              {totalHarga > 0 ? formatRupiah(totalHarga) : "Rp 0"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.select}
            >
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="verifikasi">Verifikasi</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Nama Barang</th>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Tagihan</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Tindakan</th>
              </tr>
            </thead>

            <tbody>
              {dataFilter.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Belum ada riwayat transaksi
                  </td>
                </tr>
              ) : (
                dataFilter.map((item) => (
                  <tr key={item.id_pesanan}>
                    <td style={styles.tdBold}>
                      {item.kode_pesanan || `ORD-${item.id_pesanan}`}
                    </td>

                    <td style={styles.td}>
  <div style={{ fontWeight: 800, color: "#0f172a" }}>
    {item.nama_barang || "Pesanan Custom"}
  </div>

  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
    {item.kategori_barang || "Kategori belum tersedia"}
  </div>
</td>

                    <td style={styles.td}>
                      {formatTanggal(item.tanggal_pesan)}
                    </td>

                    <td style={styles.tdBold}>
                      {Number(item.total_harga || 0) > 0
                        ? formatRupiah(item.total_harga)
                        : "Menunggu Konfirmasi"}
                    </td>

                    <td style={styles.td}>
                      <span style={getStatusBadgeStyle(item.status)}>
                        {statusLabel(item.status)}
                      </span>
                    </td>

                    <td style={styles.td}>
  <button
    type="button"
    className="riwayat-action-btn"
    onClick={() => lihatDetailRiwayat(item)}
  >
    <span className="riwayat-action-icon">
      <Eye size={18} strokeWidth={2.2} />
    </span>
    <span>View</span>
  </button>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Detail Transaksi</h2>
                <p style={styles.modalSubtitle}>
                  {detail.kode_pesanan || `ORD-${detail.id_pesanan}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetail(null)}
                style={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div style={styles.detailGrid}>
              <DetailItem
                label="Order ID"
                value={detail.kode_pesanan || `ORD-${detail.id_pesanan}`}
              />

              <DetailItem
                label="Nama Barang"
                value={detail.nama_barang || "Pesanan Custom"}
              />

              <DetailItem
  label="Kategori Barang"
  value={detail.kategori_barang || "Kategori belum tersedia"}
/>

              <DetailItem
                label="Tanggal"
                value={formatTanggal(detail.tanggal_pesan)}
              />

              <DetailItem
                label="Tagihan"
                value={
                  Number(detail.total_harga || 0) > 0
                    ? formatRupiah(detail.total_harga)
                    : "Menunggu Konfirmasi"
                }
              />

              <DetailItem
                label="Status Pesanan"
                value={statusLabel(detail.status)}
              />

              <DetailItem
                label="Metode Bayar"
                value={detail.metode || "Belum ada"}
              />

              <DetailItem
                label="Status Bayar"
                value={detail.status_bayar || "Belum ada"}
              />

              <DetailItem
                label="Jumlah Bayar"
                value={
                  Number(detail.jumlah_bayar || 0) > 0
                    ? formatRupiah(detail.jumlah_bayar)
                    : "Belum ada pembayaran"
                }
              />
            </div>

            <div style={styles.catatanBox}>
              <div style={styles.detailLabel}>Catatan Anda</div>
              <div style={styles.detailValue}>
                {detail.catatan || "Tidak ada catatan"}
              </div>
            </div>

            {detail.catatan_admin && (
              <div style={{...styles.catatanBox, background: "#eff6ff", border: "1px solid #bfdbfe", margin: "0 24px 16px"}}>
                <div style={{...styles.detailLabel, color: "#1d4ed8"}}>📋 Catatan Admin</div>
                <div style={{...styles.detailValue, color: "#1e40af"}}>
                  {detail.catatan_admin}
                </div>
              </div>
            )}

            {!showPayForm ? (
              <div style={styles.modalFooter}>
                {(detail.status === "diproses" || detail.status === "pending") && Number(detail.total_harga || 0) > 0 && (!detail.status_bayar || detail.status_bayar === "ditolak" || detail.status_bayar === "pending") && (
                  <button
                    type="button"
                    onClick={() => setShowPayForm(true)}
                    style={{...styles.darkBtn, background: "#0ea5e9", marginRight: 10}}
                  >
                    Bayar Sekarang
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  style={styles.darkBtn}
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleBayar} style={{ padding: "0 24px 24px" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.detailLabel}>Metode Pembayaran</label>
                  <select 
                    value={metode} 
                    onChange={e => setMetode(e.target.value)} 
                    style={{...styles.select, width: "100%", marginTop: 6, boxSizing: "border-box"}}
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="tunai">Tunai</option>
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.detailLabel}>Jumlah Bayar (Rp)</label>
                  <input 
                    type="number" 
                    value={jumlahBayar} 
                    onChange={e => setJumlahBayar(e.target.value)} 
                    style={{...styles.select, width: "100%", marginTop: 6, boxSizing: "border-box"}}
                    required
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={styles.detailLabel}>Bukti Pembayaran (Gambar)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setBuktiBayar(e.target.files[0])} 
                    style={{ width: "100%", marginTop: 6 }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    style={{...styles.darkBtn, background: "#94a3b8"}}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{...styles.darkBtn, background: "#10b981"}}
                  >
                    {isSubmitting ? "Mengunggah..." : "Kirim Pembayaran"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value}</div>
    </div>
  );
}

function statusLabel(status) {
  const data = {
    pending: "Pending",
    verifikasi: "Verifikasi",
    diproses: "Diproses",
    selesai: "Selesai",
  };

  return data[status] || status || "-";
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRupiah(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

function getStatusBadgeStyle(status) {
  const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 88,
  minHeight: 32,
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
};

  if (status === "pending") {
    return {
      ...base,
      background: "#f1f5f9",
      border: "1px solid #cbd5e1",
      color: "#64748b",
    };
  }

  if (status === "verifikasi") {
    return {
      ...base,
      background: "#dbeafe",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
    };
  }

  if (status === "diproses") {
    return {
      ...base,
      background: "#ffedd5",
      border: "1px solid #fed7aa",
      color: "#ea580c",
    };
  }

  if (status === "selesai") {
    return {
      ...base,
      background: "#dcfce7",
      border: "1px solid #bbf7d0",
      color: "#16a34a",
    };
  }

  return {
    ...base,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
  };
}

const styles = {

actionViewBtn: {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  background: "transparent",
  border: "none",
  color: "#073B63",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
},

eyeIcon: {
  fontSize: 20,
  color: "#073B63",
},

  card: {
    background: "white",
    borderRadius: 20,
    border: "1px solid #eef2f7",
    overflow: "hidden",
  },

  top: {
    padding: 22,
    borderBottom: "1px solid #f1f5f9",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    alignItems: "center",
  },

  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },

  value: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
    marginTop: 4,
  },

  select: {
    width: 180,
    height: 42,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "0 14px",
    outline: "none",
    background: "white",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  },

  th: {
    textAlign: "left",
    padding: "16px 22px",
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
  },

  td: {
    textAlign: "left",
    padding: "18px 22px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f8fafc",
  },

  tdBold: {
    textAlign: "left",
    padding: "18px 22px",
    fontSize: 13,
    color: "#0f172a",
    fontWeight: 800,
    borderBottom: "1px solid #f8fafc",
  },

  empty: {
    textAlign: "center",
    padding: 40,
    color: "#94a3b8",
  },

  actionCard: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "8px 14px",
    cursor: "pointer",
    color: "#0f172a",
    fontSize: 13,
    fontWeight: 800,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 620,
    background: "white",
    borderRadius: 22,
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    maxHeight: "90vh",
    overflowY: "auto",
  },

  modalHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  modalTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },

  closeBtn: {
    width: 34,
    height: 34,
    border: "none",
    borderRadius: 10,
    background: "#f1f5f9",
    fontSize: 22,
    cursor: "pointer",
    color: "#0f172a",
  },

  detailGrid: {
    padding: 24,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  detailItem: {
    background: "#f8fafc",
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 14,
  },

  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    marginBottom: 6,
  },

  detailValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 800,
  },

  catatanBox: {
    margin: "0 24px 24px",
    background: "#f8fafc",
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 14,
  },

  modalFooter: {
    padding: "18px 24px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "flex-end",
  },

  darkBtn: {
    height: 42,
    border: "none",
    borderRadius: 12,
    background: "#1e293b",
    color: "white",
    fontWeight: 800,
    padding: "0 20px",
    cursor: "pointer",
  },
};

export default RiwayatTransaksi;