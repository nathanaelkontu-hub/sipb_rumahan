import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Package, Clock, DollarSign } from 'lucide-react';

function formatRupiah(angka) {
  return "Rp " + parseFloat(angka || 0).toLocaleString("id-ID");
}

function generateOrderId(kodePesanan) {
  return kodePesanan || "-";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(res => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal load dashboard", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Gagal memuat data dashboard.</div>;

  let verifikasi = 0;
  let pending = 0;
  data.per_status?.forEach(s => {
    if (s.status === 'verifikasi') verifikasi = parseInt(s.total);
    if (s.status === 'pending') pending = parseInt(s.total);
  });
  const totalTertunda = verifikasi + pending;

  const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const sekarang = new Date();
  const chartData = [];
  
  for (let i = 5; i >= 0; i--) {
    const tgl = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    const bulan = tgl.getMonth() + 1;
    const tahun = tgl.getFullYear();
    const label = namaBulan[tgl.getMonth()];
    
    let total_pendapatan = 0;
    const found = data.per_bulan?.find(item => parseInt(item.bulan) === bulan && parseInt(item.tahun) === tahun);
    if (found) {
      total_pendapatan = parseFloat(found.total_pendapatan) || 0;
    }
    
    chartData.push({
      name: label,
      pendapatan: total_pendapatan
    });
  }

  const statusLabel = {
    pending: "Menunggu Verifikasi",
    diproses: "Sedang Diproses",
    selesai: "Terverifikasi",
    verifikasi: "Perlu Verifikasi"
  };

  const statusColor = {
    pending: "#d97706",
    diproses: "#2563eb",
    selesai: "#059669",
    verifikasi: "#7c3aed"
  };
  const statusBg = {
    pending: "#fef3c7",
    diproses: "#dbeafe",
    selesai: "#d1fae5",
    verifikasi: "#ede9fe"
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px" }}>Beranda</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>Order Barang</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, background: "#f1f5f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={18} color="#374151" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Bulan ini</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Total Pesanan</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{data.total_pesanan}</div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, background: "#f1f5f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color="#374151" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{totalTertunda} tertunda</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Verifikasi tertunda</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{verifikasi}</div>
          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 5, fontWeight: 600 }}>Perlu perhatian</div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, background: "#f1f5f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={18} color="#374151" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Bulan ini</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Pendapatan penjualan</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{formatRupiah(data.total_pendapatan)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 22 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>Tren Pendapatan Penjualan</h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return (val/1000000).toFixed(1) + 'Jt';
                    if (val >= 1000) return (val/1000).toFixed(0) + 'K';
                    return val;
                  }}
                />
                <RechartsTooltip formatter={(value) => formatRupiah(value)} labelStyle={{ color: '#1e293b', fontWeight: 700 }} />
                <Line type="monotone" dataKey="pendapatan" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>Pendapatan Bulanan</h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return (val/1000000).toFixed(1) + 'Jt';
                    if (val >= 1000) return (val/1000).toFixed(0) + 'K';
                    return val;
                  }}
                />
                <RechartsTooltip formatter={(value) => formatRupiah(value)} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="pendapatan" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>Pesanan Terbaru</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>ID Pesanan</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Pelanggan</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Total Harga</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!data.pesanan_terbaru || data.pesanan_terbaru.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: "30px 20px", fontSize: 13 }}>
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                data.pesanan_terbaru.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#fafafa"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151", fontWeight: 600 }}>
                      {generateOrderId(p.kode_pesanan)}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>
                      {p.nama_pelanggan}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151", fontWeight: 600 }}>
                      {formatRupiah(p.total_harga)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: statusColor[p.status] || "#64748b",
                        background: statusBg[p.status] || "#f1f5f9",
                        padding: "4px 10px",
                        borderRadius: 20
                      }}>
                        {statusLabel[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}