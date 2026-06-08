const db = require('../config/database');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

// 1. Dashboard Metrics
exports.getDashboard = async (req, res) => {
    try {
        // Total orders this month
        const [totalPesananRows] = await db.execute(
            `SELECT COUNT(*) as total_pesanan 
             FROM pesanan 
             WHERE MONTH(tanggal_pesan) = MONTH(CURRENT_DATE()) 
               AND YEAR(tanggal_pesan) = YEAR(CURRENT_DATE())`
        );
        const total_pesanan = totalPesananRows[0].total_pesanan || 0;

        // Total revenue this month (completed/selesai orders)
        const [totalPendapatanRows] = await db.execute(
            `SELECT SUM(total_harga) as total_pendapatan 
             FROM pesanan 
             WHERE status = 'selesai' 
               AND MONTH(tanggal_pesan) = MONTH(CURRENT_DATE()) 
               AND YEAR(tanggal_pesan) = YEAR(CURRENT_DATE())`
        );
        const total_pendapatan = parseFloat(totalPendapatanRows[0].total_pendapatan || 0);

        // Orders per status
        const [perStatusRows] = await db.execute(
            `SELECT status, COUNT(*) as total 
             FROM pesanan 
             GROUP BY status`
        );

        // Revenue per month (completed/selesai orders)
        const [perBulanRows] = await db.execute(
            `SELECT MONTH(tanggal_pesan) as bulan, YEAR(tanggal_pesan) as tahun, SUM(total_harga) as total_pendapatan 
             FROM pesanan 
             WHERE status = 'selesai' 
             GROUP BY YEAR(tanggal_pesan), MONTH(tanggal_pesan)
             ORDER BY YEAR(tanggal_pesan) DESC, MONTH(tanggal_pesan) DESC`
        );

        // Recent 5 orders
        const [recentRows] = await db.execute(
            `SELECT p.kode_pesanan, pl.nama as nama_pelanggan, p.total_harga, p.status 
             FROM pesanan p 
             JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan 
             ORDER BY p.tanggal_pesan DESC 
             LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                total_pesanan,
                total_pendapatan,
                per_status: perStatusRows,
                per_bulan: perBulanRows,
                pesanan_terbaru: recentRows
            }
        });
    } catch (error) {
        console.error('getDashboard error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat dashboard' });
    }
};

// 2. Get Pesanan List
exports.getPesanan = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT p.*, pl.nama as nama_pelanggan,
                   py.bukti_bayar, py.jumlah_bayar, py.metode, py.status as status_bayar,
                   (SELECT COALESCE(SUM(jumlah_bayar), 0) FROM pembayaran WHERE id_pesanan = p.id_pesanan AND status = 'diterima') as total_dibayar
            FROM pesanan p 
            JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
            LEFT JOIN pembayaran py ON py.id_pembayaran = (
                SELECT MAX(id_pembayaran) FROM pembayaran WHERE id_pesanan = p.id_pesanan
            )
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }

        if (search) {
            query += ` AND (p.kode_pesanan LIKE ? OR pl.nama LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY p.tanggal_pesan DESC`;

        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getPesanan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat pesanan' });
    }
};

// 3. Get Detail Pesanan
exports.getDetailPesanan = async (req, res) => {
    try {
        const { id } = req.params;

        const [orderRows] = await db.execute(
            `SELECT p.*, pl.nama as nama_pelanggan, pl.email, pl.telepon, pl.alamat 
             FROM pesanan p 
             JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan 
             WHERE p.id_pesanan = ?`,
            [id]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }

        const [itemRows] = await db.execute(
            `SELECT dp.*, b.nama_barang, b.satuan 
             FROM detail_pesanan dp 
             JOIN barang b ON dp.id_barang = b.id_barang 
             WHERE dp.id_pesanan = ?`,
            [id]
        );

        res.json({
            success: true,
            data: {
                order: orderRows[0],
                items: itemRows
            }
        });
    } catch (error) {
        console.error('getDetailPesanan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan' });
    }
};

// 4. Update Status Pesanan
exports.updateStatusPesanan = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, catatan_admin, total_harga, harga_koordinasi, status_bayar } = req.body;

        let query = `UPDATE pesanan SET status = ?, catatan_admin = ?`;
        const params = [status, catatan_admin || null];

        if (total_harga !== undefined) {
            query += `, total_harga = ?`;
            params.push(total_harga);
        }

        if (harga_koordinasi !== undefined) {
            query += `, harga_koordinasi = ?`;
            params.push(harga_koordinasi);
        }

        if (status === 'selesai') {
            query += `, tanggal_selesai = NOW()`;
        }

        query += ` WHERE id_pesanan = ?`;
        params.push(id);

        await db.execute(query, params);

        // Update status pembayaran jika admin memilihnya secara eksplisit dari dropdown
        if (status_bayar) {
            await db.execute(
                `UPDATE pembayaran 
                 SET status = ? 
                 WHERE id_pembayaran = (
                     SELECT max_id FROM (
                         SELECT MAX(id_pembayaran) as max_id FROM pembayaran WHERE id_pesanan = ?
                     ) AS tmp
                 )`,
                [status_bayar, id]
            );
        } else if (status === 'selesai') {
            // Fallback: Jika pesanan selesai tapi admin tidak mengirim status_bayar, otomatis jadikan diterima
            await db.execute(
                `UPDATE pembayaran SET status = 'diterima' WHERE id_pesanan = ? AND status = 'pending'`,
                [id]
            );
        }

        // Synchronize detail_pesanan pricing for consistency in reports
        if (total_harga !== undefined) {
            const [items] = await db.execute(
                `SELECT * FROM detail_pesanan WHERE id_pesanan = ?`,
                [id]
            );

            if (items.length === 1) {
                await db.execute(
                    `UPDATE detail_pesanan 
                     SET harga_satuan = ?, subtotal = ? 
                     WHERE id_detail = ?`,
                    [total_harga, total_harga, items[0].id_detail]
                );
            } else if (items.length > 1) {
                const totalQty = items.reduce((sum, item) => sum + item.jumlah, 0);
                if (totalQty > 0) {
                    for (let item of items) {
                        const itemShare = (item.jumlah / totalQty) * total_harga;
                        await db.execute(
                            `UPDATE detail_pesanan 
                             SET harga_satuan = ?, subtotal = ? 
                             WHERE id_detail = ?`,
                            [itemShare / item.jumlah, itemShare, item.id_detail]
                        );
                    }
                }
            }
        }

        res.json({ success: true, message: 'Status pesanan berhasil diperbarui' });
    } catch (error) {
        console.error('updateStatusPesanan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan' });
    }
};

// 5. Get Pelanggan List
exports.getPelanggan = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT 
                pl.id_pelanggan, pl.nama, pl.email, pl.telepon, pl.alamat, pl.status, pl.created_at, pl.updated_at,
                COUNT(p.id_pesanan) as total_pesanan,
                COALESCE(SUM(CASE WHEN p.status = 'selesai' THEN p.total_harga ELSE 0 END), 0) as total_belanja
            FROM pelanggan pl 
            LEFT JOIN pesanan p ON pl.id_pelanggan = p.id_pelanggan
            WHERE pl.role = 'pelanggan'
        `;
        const params = [];

        if (search) {
            query += ` AND (pl.nama LIKE ? OR pl.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` GROUP BY pl.id_pelanggan ORDER BY pl.nama ASC`;

        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getPelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat pelanggan' });
    }
};

// 6. Update Status Pelanggan
exports.updateStatusPelanggan = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.execute(
            `UPDATE pelanggan SET status = ? WHERE id_pelanggan = ?`,
            [status, id]
        );

        res.json({ success: true, message: 'Status pelanggan berhasil diperbarui' });
    } catch (error) {
        console.error('updateStatusPelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status pelanggan' });
    }
};

// 7. Get Laporan (mendukung tipe: ringkasan | detail | pelanggan | bulanan)
exports.getLaporan = async (req, res) => {
    try {
        const { tahun, tipe = 'ringkasan', tgl_mulai, tgl_selesai } = req.query;
        const queryTahun = tahun || new Date().getFullYear();

        const useRange = tgl_mulai && tgl_selesai;
        const dateFilterP = useRange
            ? `p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?`
            : `p.status = 'selesai' AND YEAR(p.tanggal_pesan) = ?`;
        const dateParams = useRange ? [tgl_mulai, tgl_selesai] : [queryTahun];

        let data = [];

        if (tipe === 'detail') {
            [data] = await db.execute(
                `SELECT p.id_pesanan, p.kode_pesanan, p.tanggal_pesan, p.total_harga,
                        pl.nama as nama_pelanggan, pl.telepon,
                        GROUP_CONCAT(b.nama_barang ORDER BY b.nama_barang SEPARATOR ', ') as nama_barang,
                        SUM(dp.jumlah) as total_qty
                 FROM pesanan p
                 JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                 LEFT JOIN detail_pesanan dp ON dp.id_pesanan = p.id_pesanan
                 LEFT JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE ${dateFilterP}
                 GROUP BY p.id_pesanan
                 ORDER BY p.tanggal_pesan DESC`,
                dateParams
            );
        } else if (tipe === 'pelanggan') {
            [data] = await db.execute(
                `SELECT pl.id_pelanggan, pl.nama as nama_pelanggan, pl.email, pl.telepon,
                        COUNT(DISTINCT p.id_pesanan) as jumlah_pesanan,
                        SUM(dp.subtotal) as total_belanja,
                        SUM(dp.jumlah * b.harga_dasar) as total_modal
                 FROM pesanan p
                 JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                 LEFT JOIN detail_pesanan dp ON dp.id_pesanan = p.id_pesanan
                 LEFT JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE ${dateFilterP}
                 GROUP BY pl.id_pelanggan
                 ORDER BY total_belanja DESC`,
                dateParams
            );
        } else if (tipe === 'bulanan') {
            const dateFilterBln = useRange
                ? `p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?`
                : `p.status = 'selesai' AND YEAR(p.tanggal_pesan) = ?`;
            [data] = await db.execute(
                `SELECT MONTH(p.tanggal_pesan) as bulan, YEAR(p.tanggal_pesan) as tahun,
                        COUNT(DISTINCT p.id_pesanan) as jumlah_pesanan,
                        SUM(dp.jumlah) as total_qty,
                        SUM(dp.subtotal) as total_pendapatan,
                        SUM(dp.jumlah * b.harga_dasar) as total_modal
                 FROM pesanan p
                 LEFT JOIN detail_pesanan dp ON dp.id_pesanan = p.id_pesanan
                 LEFT JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE ${dateFilterBln}
                 GROUP BY YEAR(p.tanggal_pesan), MONTH(p.tanggal_pesan)
                 ORDER BY tahun ASC, bulan ASC`,
                dateParams
            );
        } else {
            // ringkasan (default): rekap per barang
            [data] = await db.execute(
                `SELECT b.nama_barang, 
                        SUM(dp.jumlah) as total_qty, 
                        SUM(dp.subtotal) as total_pendapatan,
                        b.harga_dasar as harga_beli_satuan,
                        MAX(dp.harga_satuan) as harga_jual_max,
                        MIN(dp.harga_satuan) as harga_jual_min
                 FROM detail_pesanan dp
                 JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
                 JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE ${dateFilterP}
                 GROUP BY b.id_barang, b.nama_barang
                 ORDER BY total_pendapatan DESC`,
                dateParams
            );
        }

        // Summary total pendapatan
        const sumFilter = useRange
            ? `status = 'selesai' AND DATE(tanggal_pesan) BETWEEN ? AND ?`
            : `status = 'selesai' AND YEAR(tanggal_pesan) = ?`;
        const [sumRows] = await db.execute(
            `SELECT SUM(total_harga) as total_pendapatan FROM pesanan WHERE ${sumFilter}`,
            dateParams
        );

        res.json({
            success: true,
            tipe,
            data,
            summary: {
                total_pendapatan: parseFloat(sumRows[0].total_pendapatan || 0)
            }
        });
    } catch (error) {
        console.error('getLaporan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat laporan keuangan' });
    }
};

// 8. Generate Excel Report (Type-Specific: ringkasan | detail | pelanggan | bulanan)
exports.generateExcelLaporan = async (req, res) => {
    try {
        const { tgl_mulai, tgl_selesai, tipe = 'ringkasan' } = req.query;

        if (!tgl_mulai || !tgl_selesai) {
            return res.status(400).json({ success: false, message: 'Tanggal mulai dan selesai wajib diisi' });
        }

        const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
                            'Juli','Agustus','September','Oktober','November','Desember'];


        // ---- Fetch Global Stats ----
        const [[statSummary]] = await db.execute(`
            SELECT SUM(p.total_harga) as total_revenue
            FROM pesanan p
            WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
        `, [tgl_mulai, tgl_selesai]);

        const [kategoriData] = await db.execute(`
            SELECT b.kategori_barang, SUM(dp.jumlah) as total_qty
            FROM detail_pesanan dp
            JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
            JOIN barang b ON dp.id_barang = b.id_barang
            WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
            GROUP BY b.kategori_barang
            ORDER BY total_qty DESC
            LIMIT 1
        `, [tgl_mulai, tgl_selesai]);

        const [subKategoriData] = await db.execute(`
            SELECT b.sub_kategori_barang, SUM(dp.jumlah) as total_qty
            FROM detail_pesanan dp
            JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
            JOIN barang b ON dp.id_barang = b.id_barang
            WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
            GROUP BY b.sub_kategori_barang
            ORDER BY total_qty DESC
            LIMIT 1
        `, [tgl_mulai, tgl_selesai]);

        const startDate = new Date(tgl_mulai);
        const endDate = new Date(tgl_selesai);
        const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
        const rataRata = (statSummary.total_revenue || 0) / (diffMonths || 1);

        const kategoriFavorit = kategoriData.length > 0 ? kategoriData[0].kategori_barang : '-';
        const subKategoriFavorit = subKategoriData.length > 0 ? subKategoriData[0].sub_kategori_barang : '-';

        // ---- Fetch data sesuai tipe ----
        let mainData = [];

        if (tipe === 'detail') {
            [mainData] = await db.execute(
                `SELECT DATE(p.tanggal_pesan) as tanggal, p.kode_pesanan, pl.nama as nama_pelanggan,
                        b.nama_barang, dp.jumlah, dp.harga_satuan, dp.subtotal
                 FROM detail_pesanan dp
                 JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
                 JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                 JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
                 ORDER BY p.tanggal_pesan ASC, p.id_pesanan ASC`,
                [tgl_mulai, tgl_selesai]
            );
        } else if (tipe === 'pelanggan') {
            [mainData] = await db.execute(
                `SELECT pl.nama as nama_pelanggan, pl.email, pl.telepon,
                        COUNT(DISTINCT p.id_pesanan) as jumlah_pesanan,
                        SUM(dp.subtotal) as total_belanja,
                        SUM(dp.jumlah * b.harga_dasar) as total_modal
                 FROM pesanan p
                 JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                 LEFT JOIN detail_pesanan dp ON dp.id_pesanan = p.id_pesanan
                 LEFT JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
                 GROUP BY pl.id_pelanggan
                 ORDER BY total_belanja DESC`,
                [tgl_mulai, tgl_selesai]
            );
        } else if (tipe === 'bulanan') {
            [mainData] = await db.execute(
                `SELECT MONTH(p.tanggal_pesan) as bulan, YEAR(p.tanggal_pesan) as tahun,
                        COUNT(DISTINCT p.id_pesanan) as jumlah_pesanan,
                        SUM(dp.jumlah) as total_qty,
                        SUM(dp.subtotal) as total_pendapatan,
                        SUM(dp.jumlah * b.harga_dasar) as total_modal
                 FROM pesanan p
                 LEFT JOIN detail_pesanan dp ON dp.id_pesanan = p.id_pesanan
                 LEFT JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
                 GROUP BY YEAR(p.tanggal_pesan), MONTH(p.tanggal_pesan)
                 ORDER BY tahun ASC, bulan ASC`,
                [tgl_mulai, tgl_selesai]
            );
        } else {
            // ringkasan (default): group by barang
            [mainData] = await db.execute(
                `SELECT b.nama_barang, 
                        SUM(dp.jumlah) as total_qty, 
                        SUM(dp.subtotal) as total_pendapatan,
                        b.harga_dasar as harga_beli_satuan,
                        MAX(dp.harga_satuan) as harga_jual_max,
                        MIN(dp.harga_satuan) as harga_jual_min
                 FROM detail_pesanan dp
                 JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
                 JOIN barang b ON dp.id_barang = b.id_barang
                 WHERE p.status = 'selesai' AND DATE(p.tanggal_pesan) BETWEEN ? AND ?
                 GROUP BY b.id_barang, b.nama_barang
                 ORDER BY total_pendapatan DESC`,
                [tgl_mulai, tgl_selesai]
            );
        }

        // Summary total (semua tipe)
        const [[summary]] = await db.execute(
            `SELECT COUNT(*) as total_transaksi,
                    COALESCE(SUM(total_harga), 0) as total_pendapatan,
                    COALESCE(AVG(total_harga), 0) as avg_transaksi
             FROM pesanan
             WHERE status = 'selesai' AND DATE(tanggal_pesan) BETWEEN ? AND ?`,
            [tgl_mulai, tgl_selesai]
        );

        // ---- Setup Workbook ----
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SIPB Rumahan';
        workbook.created = new Date();
        workbook.modified = new Date();

        const borderStyle = {
            top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right:  { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        const headerFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        const totalsFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
        const headerFont  = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        const textFont    = { name: 'Segoe UI', size: 10 };
        const boldFont    = { name: 'Segoe UI', size: 10, bold: true };
        const currencyFmt = '"Rp"#,##0';

        function addTitleBlock(ws, title, colSpan = 6) {
            ws.mergeCells(`A1:${String.fromCharCode(64 + colSpan)}1`);
            const t = ws.getCell('A1');
            t.value = title;
            t.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF1F4E78' } };
            t.alignment = { vertical: 'middle' };
            ws.getRow(1).height = 30;

            ws.mergeCells(`A2:${String.fromCharCode(64 + colSpan)}2`);
            const s = ws.getCell('A2');
            s.value = `Periode: ${tgl_mulai} s/d ${tgl_selesai}`;
            s.font = { name: 'Segoe UI', size: 10, bold: true, italic: true, color: { argb: 'FF64748B' } };
            s.alignment = { vertical: 'middle' };
            ws.getRow(2).height = 20;
            ws.getRow(3).height = 10;
        }

        function styleHeaderRow(ws, rowNum, colCount) {
            ws.getRow(rowNum).height = 26;
            for (let c = 1; c <= colCount; c++) {
                const cell = ws.getCell(rowNum, c);
                cell.font = headerFont;
                cell.fill = headerFill;
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = borderStyle;
            }
        }

        function addTotalRow(ws, rowNum, colCount, formulas, numFmts = {}) {
            ws.getCell(`A${rowNum}`).value = 'TOTAL';
            ws.getRow(rowNum).height = 22;
            for (let c = 1; c <= colCount; c++) {
                const cell = ws.getCell(rowNum, c);
                cell.font = boldFont;
                cell.fill = totalsFill;
                cell.border = borderStyle;
                if (formulas[c]) cell.value = formulas[c];
                cell.numFmt = numFmts[c] || '';
                cell.alignment = { horizontal: c === 1 ? 'left' : 'right', vertical: 'middle' };
            }
        }

        // ---- Sheet 1: Sesuai tipe ----
        if (tipe === 'detail') {
            const ws = workbook.addWorksheet('Detail Transaksi');
            addTitleBlock(ws, 'LAPORAN DETAIL TRANSAKSI', 7);
            ws.addRow(['Tanggal', 'Kode Pesanan', 'Nama Pelanggan', 'Nama Barang', 'Qty', 'Harga Satuan', 'Total']);
            styleHeaderRow(ws, 4, 7);

            const startRow = 5;
            mainData.forEach((row, i) => {
                ws.addRow([
                    new Date(row.tanggal),
                    row.kode_pesanan,
                    row.nama_pelanggan,
                    row.nama_barang,
                    parseInt(row.jumlah),
                    parseFloat(row.harga_satuan),
                    parseFloat(row.subtotal)
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 7; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c === 1) { cell.numFmt = 'yyyy-mm-dd'; cell.alignment = { horizontal: 'center', vertical: 'middle' }; }
                    else if (c === 5) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c === 6 || c === 7) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                }
            });

            const endRow = startRow + mainData.length - 1;
            if (mainData.length > 0) {
                ws.getRow(endRow + 1).height = 8;
                addTotalRow(ws, endRow + 2, 7,
                    { 6: { formula: `SUM(F${startRow}:F${endRow})` }, 7: { formula: `SUM(G${startRow}:G${endRow})` } },
                    { 6: currencyFmt, 7: currencyFmt }
                );
            }
            const summaries = [
                ['KATEGORI FAVORIT', kategoriFavorit],
                ['SUB-KATEGORI FAVORIT', subKategoriFavorit],
                ['RATA-RATA PENJUALAN/BULAN', rataRata]
            ];

            const titleRow = endRow + 4;
            ws.getCell(titleRow, 1).value = 'DATA YANG DIOLAH';
            ws.mergeCells(`A${titleRow}:C${titleRow}`);
            ws.getCell(titleRow, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getCell(titleRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell(titleRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            ws.getCell(titleRow, 1).border = borderStyle;
            ws.getCell(titleRow, 2).border = borderStyle;
            ws.getCell(titleRow, 3).border = borderStyle;

            summaries.forEach((s, i) => {
                const r = titleRow + 1 + i;
                ws.getCell(r, 1).value = s[0];
                ws.mergeCells(`A${r}:B${r}`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 2).border = borderStyle;
                
                ws.getCell(r, 3).border = borderStyle;
                if (typeof s[1] === 'number') {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).numFmt = currencyFmt;
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });

            ws.getColumn(1).width = 14; ws.getColumn(2).width = 18; ws.getColumn(3).width = 22;
            ws.getColumn(4).width = 25; ws.getColumn(5).width = 8;  ws.getColumn(6).width = 18; ws.getColumn(7).width = 18;

        } else if (tipe === 'pelanggan') {
            const ws = workbook.addWorksheet('Per Pelanggan');
            addTitleBlock(ws, 'LAPORAN PER PELANGGAN', 5);
            ws.addRow(['Nama Pelanggan', 'Email', 'Telepon', 'Jumlah Pesanan', 'Total Belanja']);
            styleHeaderRow(ws, 4, 5);

            const startRow = 5;
            mainData.forEach((row, i) => {
                ws.addRow([
                    row.nama_pelanggan,
                    row.email || '-',
                    row.telepon || '-',
                    parseInt(row.jumlah_pesanan),
                    parseFloat(row.total_belanja)
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 5; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c === 4) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c === 5) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                }
            });

            const endRow = startRow + mainData.length - 1;
            if (mainData.length > 0) {
                ws.getRow(endRow + 1).height = 8;
                addTotalRow(ws, endRow + 2, 5,
                    { 4: { formula: `SUM(D${startRow}:D${endRow})` }, 5: { formula: `SUM(E${startRow}:E${endRow})` } },
                    { 4: '#,##0', 5: currencyFmt }
                );
            }
            
            let totalPesananAll = 0;
            let totalBelanjaAll = 0;
            if (mainData.length > 0) {
                totalPesananAll = mainData.reduce((acc, row) => acc + parseInt(row.jumlah_pesanan || 0), 0);
                totalBelanjaAll = mainData.reduce((acc, row) => acc + parseFloat(row.total_belanja || 0), 0);
            }
            const rataRataPesanan = mainData.length > 0 ? (totalPesananAll / mainData.length) : 0;
            const rataRataNilaiTransaksi = totalPesananAll > 0 ? (totalBelanjaAll / totalPesananAll) : 0;

            const summaries = [
                ['RATA-RATA PESANAN/PELANGGAN', (Math.round(rataRataPesanan * 10) / 10).toString() + ' pesanan'],
                ['RATA-RATA NILAI TRANSAKSI', rataRataNilaiTransaksi]
            ];

            const titleRow = endRow + 4;
            ws.getCell(titleRow, 1).value = 'DATA YANG DIOLAH';
            ws.mergeCells(`A${titleRow}:C${titleRow}`);
            ws.getCell(titleRow, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getCell(titleRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell(titleRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            ws.getCell(titleRow, 1).border = borderStyle;
            ws.getCell(titleRow, 2).border = borderStyle;
            ws.getCell(titleRow, 3).border = borderStyle;

            summaries.forEach((s, i) => {
                const r = titleRow + 1 + i;
                ws.getCell(r, 1).value = s[0];
                ws.mergeCells(`A${r}:B${r}`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 2).border = borderStyle;
                
                ws.getCell(r, 3).border = borderStyle;
                if (typeof s[1] === 'number') {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).numFmt = currencyFmt;
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });

            ws.getColumn(1).width = 25; ws.getColumn(2).width = 28;
            ws.getColumn(3).width = 16; ws.getColumn(4).width = 16; ws.getColumn(5).width = 22;

        } else if (tipe === 'bulanan') {
            const ws = workbook.addWorksheet('Laporan Bulanan');
            addTitleBlock(ws, 'LAPORAN BULANAN', 5);
            ws.addRow(['Bulan', 'Tahun', 'Jumlah Pesanan', 'Total Pendapatan', '% dari Total']);
            styleHeaderRow(ws, 4, 5);

            const grandTotal = parseFloat(summary.total_pendapatan || 0);
            const startRow = 5;
            mainData.forEach((row, i) => {
                const pct = grandTotal > 0 ? parseFloat(row.total_pendapatan) / grandTotal : 0;
                ws.addRow([
                    NAMA_BULAN[parseInt(row.bulan) - 1],
                    parseInt(row.tahun),
                    parseInt(row.jumlah_pesanan),
                    parseFloat(row.total_pendapatan),
                    pct
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 5; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c <= 2) { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                    else if (c === 3) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c === 4) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.numFmt = '0.00%'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                }
            });

            const endRow = startRow + mainData.length - 1;
            if (mainData.length > 0) {
                ws.getRow(endRow + 1).height = 8;
                addTotalRow(ws, endRow + 2, 5,
                    { 3: { formula: `SUM(C${startRow}:C${endRow})` }, 4: { formula: `SUM(D${startRow}:D${endRow})` }, 5: grandTotal > 0 ? 1 : 0 },
                    { 3: '#,##0', 4: currencyFmt, 5: '0.00%' }
                );
            }
            const summaries = [
                ['RATA-RATA PENJUALAN/BULAN', rataRata]
            ];

            const titleRow = endRow + 4;
            ws.getCell(titleRow, 1).value = 'DATA YANG DIOLAH';
            ws.mergeCells(`A${titleRow}:C${titleRow}`);
            ws.getCell(titleRow, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getCell(titleRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell(titleRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            ws.getCell(titleRow, 1).border = borderStyle;
            ws.getCell(titleRow, 2).border = borderStyle;
            ws.getCell(titleRow, 3).border = borderStyle;

            summaries.forEach((s, i) => {
                const r = titleRow + 1 + i;
                ws.getCell(r, 1).value = s[0];
                ws.mergeCells(`A${r}:B${r}`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 2).border = borderStyle;
                
                ws.getCell(r, 3).border = borderStyle;
                if (typeof s[1] === 'number') {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).numFmt = currencyFmt;
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });

            ws.getColumn(1).width = 16; ws.getColumn(2).width = 10;
            ws.getColumn(3).width = 18; ws.getColumn(4).width = 22; ws.getColumn(5).width = 15;

        } else {
            // ringkasan (default)
            const ws = workbook.addWorksheet('Ringkasan Penjualan');
            addTitleBlock(ws, 'LAPORAN RINGKASAN PENJUALAN', 3);
            ws.addRow(['Nama Barang', 'Jumlah Terjual', 'Total Pendapatan']);
            styleHeaderRow(ws, 4, 3);

            const startRow = 5;
            mainData.forEach((row, i) => {
                ws.addRow([
                    row.nama_barang,
                    parseInt(row.total_qty),
                    parseFloat(row.total_pendapatan)
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 3; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c === 1) { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                    else if (c === 2) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                }
            });

            const endRow = startRow + mainData.length - 1;
            if (mainData.length > 0) {
                ws.getRow(endRow + 1).height = 8;
                addTotalRow(ws, endRow + 2, 3,
                    { 2: { formula: `SUM(B${startRow}:B${endRow})` }, 3: { formula: `SUM(C${startRow}:C${endRow})` } },
                    { 2: '#,##0', 3: currencyFmt }
                );
            }
            const summaries = [
                ['KATEGORI FAVORIT', kategoriFavorit],
                ['SUB-KATEGORI FAVORIT', subKategoriFavorit]
            ];

            const titleRow = endRow + 4;
            ws.getCell(titleRow, 1).value = 'DATA YANG DIOLAH';
            ws.mergeCells(`A${titleRow}:C${titleRow}`);
            ws.getCell(titleRow, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            ws.getCell(titleRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getCell(titleRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            ws.getCell(titleRow, 1).border = borderStyle;
            ws.getCell(titleRow, 2).border = borderStyle;
            ws.getCell(titleRow, 3).border = borderStyle;

            summaries.forEach((s, i) => {
                const r = titleRow + 1 + i;
                ws.getCell(r, 1).value = s[0];
                ws.mergeCells(`A${r}:B${r}`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 2).border = borderStyle;
                
                ws.getCell(r, 3).border = borderStyle;
                if (typeof s[1] === 'number') {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).numFmt = currencyFmt;
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });

            ws.getColumn(1).width = 25; ws.getColumn(2).width = 18; ws.getColumn(3).width = 25;
        }

        // ---- Sheet 2: Ringkasan Keuangan (semua tipe) ----
        const wsRing = workbook.addWorksheet('Ringkasan Keuangan');
        wsRing.mergeCells('A1:B1');
        const wsRingTitle = wsRing.getCell('A1');
        wsRingTitle.value = 'RINGKASAN KEUANGAN';
        wsRingTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1F4E78' } };
        wsRingTitle.alignment = { vertical: 'middle' };
        wsRing.getRow(1).height = 28;

        wsRing.mergeCells('A2:B2');
        const wsRingPeriod = wsRing.getCell('A2');
        wsRingPeriod.value = `Periode: ${tgl_mulai} s/d ${tgl_selesai}`;
        wsRingPeriod.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
        wsRingPeriod.alignment = { vertical: 'middle' };
        wsRing.getRow(2).height = 18;
        wsRing.getRow(3).height = 10;

        wsRing.getCell('A4').value = 'Indikator';
        wsRing.getCell('B4').value = 'Nilai';
        wsRing.getRow(4).height = 24;
        for (let c = 1; c <= 2; c++) {
            const cell = wsRing.getCell(4, c);
            cell.font = headerFont; cell.fill = headerFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = borderStyle;
        }

        const summaryRows = [
            ['Total Transaksi Selesai', parseInt(summary.total_transaksi), '#,##0'],
            ['Total Pendapatan',        parseFloat(summary.total_pendapatan), currencyFmt],
            ['Rata-rata per Transaksi', parseFloat(summary.avg_transaksi),   currencyFmt],
        ];
        summaryRows.forEach(([label, val, fmt], i) => {
            const r = 5 + i;
            wsRing.getCell(`A${r}`).value = label;
            wsRing.getCell(`B${r}`).value = val;
            wsRing.getRow(r).height = 20;
            for (let c = 1; c <= 2; c++) {
                const cell = wsRing.getCell(r, c);
                cell.font = boldFont; cell.fill = totalsFill; cell.border = borderStyle;
                cell.alignment = { horizontal: c === 1 ? 'left' : 'right', vertical: 'middle' };
                if (c === 2) cell.numFmt = fmt;
            }
        });

        wsRing.getColumn(1).width = 32;
        wsRing.getColumn(2).width = 22;

        // ---- Kirim file ----
        const tipeLabel = { ringkasan: 'Ringkasan', detail: 'Detail_Transaksi', pelanggan: 'Per_Pelanggan', bulanan: 'Bulanan' };
        const filename = `Laporan_${tipeLabel[tipe] || tipe}_${tgl_mulai}_sd_${tgl_selesai}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('generateExcelLaporan error:', error);
        res.status(500).json({ success: false, message: 'Gagal men-generate file Excel' });
    }
};

// 9. User management exports
exports.getAllUser = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id_pelanggan, nama, email, telepon, role, status, created_at 
             FROM pelanggan 
             ORDER BY role ASC, nama ASC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getAllUser error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar user' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { nama, email, password, telepon, role, status } = req.body;

        const [existing] = await db.execute(
            `SELECT id_pelanggan FROM pelanggan WHERE email = ? LIMIT 1`,
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO pelanggan (nama, email, password, telepon, role, status, provider) 
             VALUES (?, ?, ?, ?, ?, ?, 'local')`,
            [nama, email, hashedPassword, telepon || null, role || 'pelanggan', status || 'aktif']
        );

        res.status(201).json({ success: true, message: 'User berhasil dibuat', id: result.insertId });
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat user' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, email, password, telepon, role, status } = req.body;

        let query = `UPDATE pelanggan SET nama = ?, email = ?, telepon = ?, role = ?, status = ?`;
        const params = [nama, email, telepon || null, role, status];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = ?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id_pelanggan = ?`;
        params.push(id);

        await db.execute(query, params);
        res.json({ success: true, message: 'User berhasil diperbarui' });
    } catch (error) {
        console.error('updateUser error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [userRows] = await db.execute(
            `SELECT role FROM pelanggan WHERE id_pelanggan = ?`,
            [id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        if (userRows[0].role === 'admin') {
            return res.status(400).json({ success: false, message: 'Admin tidak dapat dihapus!' });
        }

        await db.execute(`DELETE FROM pelanggan WHERE id_pelanggan = ?`, [id]);
        res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus user' });
    }
};

// 13. Chat messages exports
exports.getChat = async (req, res) => {
    try {
        const { id_pesanan } = req.params;

        const [rows] = await db.execute(
            `SELECT c.*, p.nama as nama_pengirim, p.role 
             FROM chat c 
             JOIN pelanggan p ON c.id_pengirim = p.id_pelanggan 
             WHERE c.id_pesanan = ? 
             ORDER BY c.waktu ASC`,
            [id_pesanan]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getChat error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat chat' });
    }
};

exports.kirimChat = async (req, res) => {
    try {
        const { id_pesanan, pesan } = req.body;
        const id_pengirim = req.user.id_pelanggan || req.user.id;
        const gambar = req.file ? req.file.path : null;

        await db.execute(
            `INSERT INTO chat (id_pesanan, id_pengirim, pesan, gambar, dibaca) 
             VALUES (?, ?, ?, ?, 0)`,
            [id_pesanan, id_pengirim, pesan || '', gambar]
        );

        res.json({ success: true, message: 'Pesan terkirim' });
    } catch (error) {
        console.error('kirimChat error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan' });
    }
};

// 15. Product list export
exports.getBarang = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM barang ORDER BY nama_barang ASC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getBarang error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat barang' });
    }
};

// 16. Laporan tersimpan (manual) - GET, POST, DELETE
exports.getLaporanTersimpan = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM laporan_tersimpan ORDER BY created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getLaporanTersimpan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat laporan tersimpan' });
    }
};

exports.simpanLaporan = async (req, res) => {
    try {
        const { nama_laporan, tipe, tgl_mulai, tgl_selesai, total_pendapatan } = req.body;
        const dibuat_oleh = req.user.id_pelanggan || req.user.id;

        if (!nama_laporan || !tipe || !tgl_mulai || !tgl_selesai) {
            return res.status(400).json({ success: false, message: 'Data laporan tidak lengkap' });
        }

        const [result] = await db.execute(
            `INSERT INTO laporan_tersimpan (nama_laporan, tipe, tgl_mulai, tgl_selesai, total_pendapatan, dibuat_oleh)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nama_laporan, tipe, tgl_mulai, tgl_selesai, total_pendapatan || 0, dibuat_oleh]
        );

        res.status(201).json({ success: true, message: 'Laporan berhasil disimpan', id: result.insertId });
    } catch (error) {
        console.error('simpanLaporan error:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan laporan' });
    }
};

exports.hapusLaporanTersimpan = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute(
            `DELETE FROM laporan_tersimpan WHERE id_laporan = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
        }
        res.json({ success: true, message: 'Laporan berhasil dihapus' });
    } catch (error) {
        console.error('hapusLaporanTersimpan error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus laporan' });
    }
};
