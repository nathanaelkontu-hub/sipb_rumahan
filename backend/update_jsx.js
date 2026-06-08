const fs = require('fs');

let code = fs.readFileSync('c:\\sipb-rumahan\\frontend-react\\src\\pages\\admin\\LaporanKeuangan.jsx', 'utf8');

// Replace Table headers
code = code.replace(
`                      {(selectedLaporan.tipeLaporan === "pelanggan") && (
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
                      )}`,
`                      {(selectedLaporan.tipeLaporan === "pelanggan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Nama Pelanggan</th>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Email / Telepon</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jml Pesanan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Modal</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Belanja</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Laba Bersih</th>
                        </>
                      )}

                      {(selectedLaporan.tipeLaporan === "bulanan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Bulan & Tahun</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jml Pesanan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Modal</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Total Pendapatan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Laba Bersih</th>
                        </>
                      )}

                      {(!selectedLaporan.tipeLaporan || selectedLaporan.tipeLaporan === "ringkasan") && (
                        <>
                          <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Nama Barang</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Jml Terjual</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Hrg Beli Satuan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Subtotal Pendapatan</th>
                          <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#475569" }}>Laba Bersih</th>
                        </>
                      )}`
);

// Replace Table bodies
code = code.replace(
`                          {(selectedLaporan.tipeLaporan === "pelanggan") && (
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
                          )}`,
`                          {(selectedLaporan.tipeLaporan === "pelanggan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{row.nama_pelanggan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>
                                <div>{row.email || "-"}</div>
                                <div style={{ fontSize: 11 }}>{row.telepon || "-"}</div>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.jumlah_pesanan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#ef4444", fontWeight: 500, textAlign: "right" }}>{formatRupiah(row.total_modal || 0)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#16a34a", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_belanja)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#10b981", fontWeight: 600, textAlign: "right" }}>{formatRupiah((row.total_belanja || 0) - (row.total_modal || 0))}</td>
                            </>
                          )}

                          {(selectedLaporan.tipeLaporan === "bulanan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{NAMA_BULAN[parseInt(row.bulan) - 1] || row.bulan} {row.tahun}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.jumlah_pesanan}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#ef4444", fontWeight: 500, textAlign: "right" }}>{formatRupiah(row.total_modal || 0)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_pendapatan || 0)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#10b981", fontWeight: 600, textAlign: "right" }}>{formatRupiah((row.total_pendapatan || 0) - (row.total_modal || 0))}</td>
                            </>
                          )}

                          {(!selectedLaporan.tipeLaporan || selectedLaporan.tipeLaporan === "ringkasan") && (
                            <>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.nama_barang}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155", textAlign: "right" }}>{row.total_qty}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#ef4444", fontWeight: 500, textAlign: "right" }}>{formatRupiah(row.harga_beli_satuan || 0)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatRupiah(row.total_pendapatan || 0)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 13, color: "#10b981", fontWeight: 600, textAlign: "right" }}>
                                {formatRupiah((row.total_pendapatan || 0) - (row.total_qty * (row.harga_beli_satuan || 0)))}
                              </td>
                            </>
                          )}`
);

fs.writeFileSync('c:\\sipb-rumahan\\frontend-react\\src\\pages\\admin\\LaporanKeuangan.jsx', code);
console.log('Update success');
