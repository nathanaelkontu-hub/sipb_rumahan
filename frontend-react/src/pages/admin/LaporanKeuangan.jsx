import { useState, useEffect } from "react";
import API from "../../api/api";
import { TrendingUp, AlertCircle, FileText, FileDown, Loader } from "lucide-react";

function formatRupiah(angka) {
  return "Rp " + parseFloat(angka || 0).toLocaleString("id-ID");
}

function formatTanggal(tglStr) {
  if (!tglStr) return "-";
  return new Date(tglStr).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });
}

function formatTglIso(tglStr) {
  if (!tglStr) return "-";
  return new Date(tglStr).toISOString().split("T")[0];
}

export default function LaporanKeuangan() {
  const [loading, setLoading] = useState(true);
  const [dataLaporan, setDataLaporan] = useState([]);
  const [totalYTD, setTotalYTD] = useState(0);
  const [jumlahGenerate, setJumlahGenerate] = useState(0); // tidak dipakai lagi, pakai gabunganLaporan.length
  
  const [saldoNunggak, setSaldoNunggak] = useState(0);
  const [pesananNunggak, setPesananNunggak] = useState(0);

  const [tipeLaporan, setTipeLaporan] = useState("ringkasan");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");
  
  const [laporanBaru, setLaporanBaru] = useState(() => {
    try {
      const saved = localStorage.getItem("sipb_laporan_baru");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [selectedData, setSelectedData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [buatLoading, setBuatLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("sipb_laporan_baru", JSON.stringify(laporanBaru));
    } catch (e) {
      console.error("Gagal menyimpan ke localStorage", e);
    }
  }, [laporanBaru]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [resLap, resPes] = await Promise.all([
          API.get("/admin/laporan?tahun=" + new Date().getFullYear()),
          API.get("/admin/pesanan?status=pending")
        ]);

        if (resLap.data.success) {
          const ytd = resLap.data.summary?.total_pendapatan || 0;
          setTotalYTD(ytd);



          // Group per bulan untuk tabel riwayat otomatis
          const groupBulan = {};
          (resLap.data.data || []).forEach(l => {
            const tgl = new Date(l.tanggal_pesan);
            const key = tgl.getFullYear() + "-" + String(tgl.getMonth() + 1).padStart(2, "0");
            const namaBln = tgl.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            if (!groupBulan[key]) {
              groupBulan[key] = {
                id: key,
                namaLaporan: `Ringkasan Penjualan ${namaBln}`,
                waktu: namaBln,
                tipe: "Ringkasan Penjualan",
                totalPendapatan: 0,
                tglBuat: l.tanggal_pesan,
              };
            }
            groupBulan[key].totalPendapatan += parseFloat(l.total_harga || 0);
          });
          setDataLaporan(Object.values(groupBulan));
        }

        if (resPes.data.success) {
          setPesananNunggak(resPes.data.data.length);
          const totalNunggak = resPes.data.data.reduce((sum, p) => sum + parseFloat(p.total_harga || 0), 0);
          setSaldoNunggak(totalNunggak);
        }
      } catch (err) {
        console.error("Gagal memuat laporan", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tampilkanDetail = async (l) => {
    setSelectedLaporan(l);
    
    if (l.data && l.data.length > 0) {
      setSelectedData(l.data);
      return;
    }

    setDetailLoading(true);
    try {
      let tipe = l.tipeLaporan || "ringkasan";
      let mulai = l.tglMulai;
      let selesai = l.tglSelesai;

      // Jika laporan bawaan otomatis per bulan
      if (!mulai || !selesai) {
        const tgl = l.tglBuat ? new Date(l.tglBuat) : new Date();
        const y = tgl.getFullYear();
        const m = String(tgl.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, tgl.getMonth() + 1, 0).getDate();
        mulai = `${y}-${m}-01`;
        selesai = `${y}-${m}-${lastDay}`;
        tipe = "ringkasan";
      }

      const res = await API.get(
        `/admin/laporan?tipe=${tipe}&tgl_mulai=${mulai}&tgl_selesai=${selesai}`
      );
      if (res.data.success) {
        setSelectedData(res.data.data || []);
      } else {
        setSelectedData([]);
      }
    } catch (err) {
      showToast("Gagal memuat detail data laporan", "error");
      setSelectedData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const buatLaporan = async () => {
    if (!tglMulai || !tglSelesai) {
      showToast("Waktu mulai dan selesai wajib diisi!", "error");
      return;
    }
    if (new Date(tglMulai) > new Date(tglSelesai)) {
      showToast("Waktu mulai tidak boleh lebih dari waktu selesai!", "error");
      return;
    }

    const tipeLabel = {
      ringkasan: "Ringkasan Penjualan",
      detail: "Detail Transaksi",
      pelanggan: "Per Pelanggan",
      bulanan: "Bulanan"
    };

    setBuatLoading(true);
    try {
      const res = await API.get(
        `/admin/laporan?tipe=${tipeLaporan}&tgl_mulai=${tglMulai}&tgl_selesai=${tglSelesai}`
      );

      const totalPendapatan = res.data.summary?.total_pendapatan || 0;
      const wktMulaiBln = new Date(tglMulai).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const wktSelesaiBln = new Date(tglSelesai).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const periodeLabel = wktMulaiBln === wktSelesaiBln ? wktMulaiBln : `${wktMulaiBln} - ${wktSelesaiBln}`;
      const namaLap = `${tipeLabel[tipeLaporan] || tipeLaporan} ${periodeLabel}`;

      const laporanItem = {
        id: Date.now().toString(),
        namaLaporan: namaLap,
        waktu: periodeLabel,
        tipe: tipeLabel[tipeLaporan] || tipeLaporan,
        tipeLaporan,
        totalPendapatan,
        tglBuat: new Date().toISOString(),
        tglMulai,
        tglSelesai,
        data: res.data.data || []
      };

      setLaporanBaru([laporanItem, ...laporanBaru]);
      showToast("Laporan berhasil dibuat!");
      tampilkanDetail(laporanItem);
    } catch (err) {
      showToast("Gagal membuat laporan: " + (err.response?.data?.message || err.message || "Error"), "error");
    } finally {
      setBuatLoading(false);
    }
  };

  const exportLaporan = async (tipe, laporan) => {
    if (tipe !== "excel") {
      showToast(`Export ${tipe.toUpperCase()} belum tersedia`, "error");
      return;
    }

    let mulai = laporan.tglMulai || tglMulai;
    let selesai = laporan.tglSelesai || tglSelesai;
    const tipeData = laporan.tipeLaporan || "ringkasan";

    if (!mulai || !selesai) {
      try {
        const tglBuat = laporan.tglBuat ? new Date(laporan.tglBuat) : new Date();
        const y = tglBuat.getFullYear();
        const m = String(tglBuat.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, tglBuat.getMonth() + 1, 0).getDate();
        mulai = `${y}-${m}-01`;
        selesai = `${y}-${m}-${lastDay}`;
      } catch {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        mulai = `${y}-${m}-01`;
        selesai = `${y}-${m}-${lastDay}`;
      }
    }

    const idKey = laporan.id || laporan.namaLaporan;
    setExportLoading(idKey);
    try {
      const token =
        localStorage.getItem("sipb_admin_token") ||
        sessionStorage.getItem("sipb_admin_token") ||
        localStorage.getItem("sipb_token") ||
        sessionStorage.getItem("sipb_token");

      const url = `http://localhost:3000/api/admin/laporan/excel?tipe=${tipeData}&tgl_mulai=${mulai}&tgl_selesai=${selesai}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Gagal generate Excel");
      }

      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `Laporan_${tipeData}_${mulai}_sd_${selesai}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dlUrl);
      showToast(`Laporan Excel berhasil diunduh!`);
    } catch (err) {
      showToast(err.message || "Gagal download Excel", "error");
    } finally {
      setExportLoading(null);
    }
  };

  const gabunganLaporan = [...laporanBaru, ...dataLaporan];

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "white", borderRadius: 10, padding: "14px 20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          borderLeft: `4px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, fontWeight: 500, color: "#1f2937",
          minWidth: 260,
          animation: "slideIn 0.3s ease",
        }}>
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
          Laporan Keuangan
        </h2>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "#f1f5f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={18} color="#374151" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Total Pendapatan (YTD)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>{formatRupiah(totalYTD)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Awal Tahun Hingga Saat Ini</div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "#fef3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={18} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Saldo Nunggak</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>{formatRupiah(saldoNunggak)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{pesananNunggak} Pesanan belum dibayar</div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={18} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Generate Laporan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>{gabunganLaporan.length}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Total laporan</div>
          </div>
        </div>
      </div>

      {/* BUAT LAPORAN BARU */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
          Buat Laporan Baru
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tipe Laporan</label>
            <select
              value={tipeLaporan}
              onChange={(e) => setTipeLaporan(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
            >
              <option value="ringkasan">Ringkasan Penjualan</option>
              <option value="pelanggan">Per Pelanggan</option>
              <option value="bulanan">Bulanan</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Waktu Mulai</label>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Waktu Selesai</label>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
            />
          </div>
        </div>
        <button
          onClick={buatLaporan}
          disabled={buatLoading}
          style={{ background: buatLoading ? "#94a3b8" : "#1e293b", color: "white", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: buatLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {buatLoading ? "Memproses..." : "Buat Laporan"}
        </button>
      </div>

      {/* DAFTAR LAPORAN */}
      <div style={{ background: "white", borderRadius: 14, padding: 0, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>Daftar Laporan</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Nama Laporan</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Waktu</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Tipe</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Total Pendapatan</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Tanggal Buat</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>Memuat laporan...</td>
                </tr>
              ) : gabunganLaporan.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>Belum ada laporan</td>
                </tr>
              ) : (
                gabunganLaporan.map((l, i) => (
                  <tr key={l.id || i} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#fafafa"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{l.namaLaporan}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{l.waktu}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{l.tipe}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {l.totalPendapatan === 0 ? "-" : formatRupiah(l.totalPendapatan)}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{formatTglIso(l.tglBuat)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => exportLaporan("excel", l)}
                          disabled={exportLoading === (l.id || l.namaLaporan)}
                          style={{ background: exportLoading === (l.id || l.namaLaporan) ? "#86efac" : "#16a34a", color: "white", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: exportLoading === (l.id || l.namaLaporan) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          {exportLoading === (l.id || l.namaLaporan)
                            ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Proses...</>
                            : <><FileDown size={12} /> Excel</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
      </div>

      {/* DETAIL ISI LAPORAN */}
      {selectedLaporan && (
        <div style={{
          marginTop: 24,
          background: "white",
          borderRadius: 14,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          border: "1px solid #f1f5f9",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc"
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                {selectedLaporan.namaLaporan}
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                Tipe: <span style={{ fontWeight: 600, color: "#475569" }}>{selectedLaporan.tipe}</span> | Periode: <span style={{ fontWeight: 600, color: "#475569" }}>{selectedLaporan.waktu}</span>
              </p>
            </div>
            <button
              onClick={() => { setSelectedLaporan(null); setSelectedData([]); }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; }}
            >
              Tutup
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {detailLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                <Loader size={24} style={{ animation: "spin 1s linear infinite", color: "#2563eb" }} />
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Memuat detail data...</span>
              </div>
            ) : selectedData.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>
                Tidak ada data transaksi selesai pada periode ini.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>No.</th>
                      
                      {/* Kolom dinamis berdasarkan tipe laporan */}
                      {(selectedLaporan.tipeLaporan === "detail") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Tanggal</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Kode Pesanan</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Pelanggan</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Daftar Barang</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Qty</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Belanja</th>
                        </>
                      )}

                      {(selectedLaporan.tipeLaporan === "pelanggan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Nama Pelanggan</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Email</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Telepon</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jumlah Pesanan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Belanja</th>
                        </>
                      )}

                      {(selectedLaporan.tipeLaporan === "bulanan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Bulan</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Tahun</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jumlah Pesanan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Pendapatan</th>
                        </>
                      )}

                      {(!selectedLaporan.tipeLaporan || selectedLaporan.tipeLaporan === "ringkasan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Nama Barang</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jumlah Terjual</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Pendapatan</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.map((row, idx) => {
                      const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
                                          'Juli','Agustus','September','Oktober','November','Desember'];
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{idx + 1}</td>
                          
                          {/* Data dinamis berdasarkan tipe laporan */}
                          {(selectedLaporan.tipeLaporan === "detail") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155" }}>
                                {new Date(row.tanggal_pesan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#2563eb", fontWeight: 600 }}>{row.kode_pesanan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.nama_pelanggan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{row.nama_barang || "-"}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.total_qty}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_harga)}</td>
                            </>
                          )}

                          {(selectedLaporan.tipeLaporan === "pelanggan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{row.nama_pelanggan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{row.email || "-"}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{row.telepon || "-"}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.jumlah_pesanan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#16a34a", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_belanja)}</td>
                            </>
                          )}

                          {(selectedLaporan.tipeLaporan === "bulanan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{NAMA_BULAN[parseInt(row.bulan) - 1] || row.bulan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{row.tahun}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.jumlah_pesanan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_pendapatan)}</td>
                            </>
                          )}

                          {(!selectedLaporan.tipeLaporan || selectedLaporan.tipeLaporan === "ringkasan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.nama_barang}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.total_qty}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_pendapatan)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}