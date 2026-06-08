const fs = require('fs');

let code = fs.readFileSync('c:\\sipb-rumahan\\backend\\controllers\\adminController.js', 'utf8');

// Replace pelanggan
code = code.replace(
`        } else if (tipe === 'pelanggan') {
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
                    { 4: { formula: \`SUM(D\${startRow}:D\${endRow})\` }, 5: { formula: \`SUM(E\${startRow}:E\${endRow})\` } },
                    { 4: '#,##0', 5: currencyFmt }
                );
            }
            ws.getColumn(1).width = 25; ws.getColumn(2).width = 28;
            ws.getColumn(3).width = 16; ws.getColumn(4).width = 16; ws.getColumn(5).width = 22;`,
`        } else if (tipe === 'pelanggan') {
            const ws = workbook.addWorksheet('Per Pelanggan');
            addTitleBlock(ws, 'LAPORAN PER PELANGGAN', 7);
            ws.addRow(['Nama Pelanggan', 'Email', 'Telepon', 'Jumlah Pesanan', 'Total Modal', 'Total Belanja', 'Laba Bersih']);
            styleHeaderRow(ws, 4, 7);

            let totalModalAll = 0;
            let totalBelanjaAll = 0;

            const startRow = 5;
            mainData.forEach((row, i) => {
                const modal = parseFloat(row.total_modal || 0);
                const belanja = parseFloat(row.total_belanja || 0);
                const laba = belanja - modal;
                
                totalModalAll += modal;
                totalBelanjaAll += belanja;

                ws.addRow([
                    row.nama_pelanggan,
                    row.email || '-',
                    row.telepon || '-',
                    parseInt(row.jumlah_pesanan),
                    modal,
                    belanja,
                    laba
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 7; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c === 4) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c >= 5) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                }
            });

            // Summary section
            const sumRowStart = startRow + mainData.length + 2;
            const summaries = [
                ['REKAPAN MODAL', totalModalAll],
                ['REKAPAN UNTUNG (KOTOR)', totalBelanjaAll],
                ['REKAPAN RUGI (RETUR)', 0],
                ['TOTAL LABA BERSIH', totalBelanjaAll - totalModalAll]
            ];

            summaries.forEach((s, i) => {
                const r = sumRowStart + i;
                ws.getCell(r, 1).value = s[0];
                ws.getCell(r, 2).value = s[1];
                ws.mergeCells(\`A\${r}:B\${r}\`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 3).border = borderStyle;
                ws.getCell(r, 3).value = s[1];
                ws.getCell(r, 3).numFmt = currencyFmt;
                ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'right' };
                ws.mergeCells(\`C\${r}:G\${r}\`);
            });

            ws.getColumn(1).width = 25; ws.getColumn(2).width = 28;
            ws.getColumn(3).width = 16; ws.getColumn(4).width = 16; 
            ws.getColumn(5).width = 20; ws.getColumn(6).width = 20; ws.getColumn(7).width = 20;`
);

// Replace bulanan
code = code.replace(
`        } else if (tipe === 'bulanan') {
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
                    { 3: { formula: \`SUM(C\${startRow}:C\${endRow})\` }, 4: { formula: \`SUM(D\${startRow}:D\${endRow})\` }, 5: grandTotal > 0 ? 1 : 0 },
                    { 3: '#,##0', 4: currencyFmt, 5: '0.00%' }
                );
            }
            ws.getColumn(1).width = 16; ws.getColumn(2).width = 10;
            ws.getColumn(3).width = 18; ws.getColumn(4).width = 22; ws.getColumn(5).width = 15;`,
`        } else if (tipe === 'bulanan') {
            const ws = workbook.addWorksheet('Laporan Bulanan');
            addTitleBlock(ws, 'LAPORAN BULANAN', 8);
            ws.addRow(['Bulan', 'Tahun', 'Jml Pesanan', 'Jml Terjual (pcs)', 'Total Modal', 'Total Pendapatan', 'Laba Bersih', '% Pendapatan']);
            styleHeaderRow(ws, 4, 8);

            const grandTotal = parseFloat(summary.total_pendapatan || 0);
            let totalModalAll = 0;
            let totalPendapatanAll = 0;

            const startRow = 5;
            mainData.forEach((row, i) => {
                const pend = parseFloat(row.total_pendapatan || 0);
                const mod = parseFloat(row.total_modal || 0);
                const laba = pend - mod;
                totalModalAll += mod;
                totalPendapatanAll += pend;

                const pct = grandTotal > 0 ? pend / grandTotal : 0;
                ws.addRow([
                    NAMA_BULAN[parseInt(row.bulan) - 1],
                    parseInt(row.tahun),
                    parseInt(row.jumlah_pesanan),
                    parseInt(row.total_qty),
                    mod,
                    pend,
                    laba,
                    pct
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 8; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c <= 2) { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                    else if (c === 3 || c === 4) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c >= 5 && c <= 7) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { cell.numFmt = '0.00%'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                }
            });

            // Summary section
            const sumRowStart = startRow + mainData.length + 2;
            const summaries = [
                ['REKAPAN MODAL', totalModalAll],
                ['REKAPAN UNTUNG (KOTOR)', totalPendapatanAll],
                ['REKAPAN RUGI (RETUR)', 0],
                ['TOTAL LABA BERSIH', totalPendapatanAll - totalModalAll]
            ];

            summaries.forEach((s, i) => {
                const r = sumRowStart + i;
                ws.getCell(r, 1).value = s[0];
                ws.getCell(r, 2).value = s[1];
                ws.mergeCells(\`A\${r}:B\${r}\`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 3).border = borderStyle;
                ws.getCell(r, 3).value = s[1];
                ws.getCell(r, 3).numFmt = currencyFmt;
                ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'right' };
                ws.mergeCells(\`C\${r}:H\${r}\`);
            });

            ws.getColumn(1).width = 16; ws.getColumn(2).width = 10;
            ws.getColumn(3).width = 15; ws.getColumn(4).width = 15;
            ws.getColumn(5).width = 20; ws.getColumn(6).width = 20; 
            ws.getColumn(7).width = 20; ws.getColumn(8).width = 15;`
);

// Replace ringkasan
code = code.replace(
`        } else {
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
                    { 2: { formula: \`SUM(B\${startRow}:B\${endRow})\` }, 3: { formula: \`SUM(C\${startRow}:C\${endRow})\` } },
                    { 2: '#,##0', 3: currencyFmt }
                );
            }
            ws.getColumn(1).width = 30; ws.getColumn(2).width = 18; ws.getColumn(3).width = 25;
        }`,
`        } else {
            // ringkasan (default)
            const ws = workbook.addWorksheet('Ringkasan Penjualan');
            addTitleBlock(ws, 'LAPORAN RINGKASAN PENJUALAN', 6);
            ws.addRow(['Nama Barang', 'Jumlah Terjual', 'Harga Jual Satuan', 'Harga Beli Satuan', 'Subtotal Penjualan', 'Laba per Item']);
            styleHeaderRow(ws, 4, 6);

            let totalModalAll = 0;
            let totalUntungKotorAll = 0;
            let produkPalingLaris = { nama: '-', qty: 0 };

            const startRow = 5;
            mainData.forEach((row, i) => {
                const qty = parseInt(row.total_qty);
                const subtotal = parseFloat(row.total_pendapatan);
                const hargaBeli = parseFloat(row.harga_beli_satuan || 0);
                const modalItem = qty * hargaBeli;
                const labaItem = subtotal - modalItem;
                
                totalModalAll += modalItem;
                totalUntungKotorAll += subtotal;
                
                if (qty > produkPalingLaris.qty) {
                    produkPalingLaris = { nama: row.nama_barang, qty: qty };
                }

                let hargaJualLabel = '';
                if (row.harga_jual_max !== row.harga_jual_min) {
                    hargaJualLabel = 'Bervariasi';
                } else {
                    hargaJualLabel = parseFloat(row.harga_jual_max);
                }

                ws.addRow([
                    row.nama_barang,
                    qty,
                    hargaJualLabel,
                    hargaBeli,
                    subtotal,
                    labaItem
                ]);
                const r = startRow + i;
                ws.getRow(r).height = 20;
                for (let c = 1; c <= 6; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = textFont;
                    cell.border = borderStyle;
                    if (c === 1) { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
                    else if (c === 2) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else if (c >= 4) { cell.numFmt = currencyFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                    else { 
                        if (typeof hargaJualLabel === 'number') cell.numFmt = currencyFmt;
                        cell.alignment = { horizontal: 'right', vertical: 'middle' }; 
                    }
                }
            });

            // Summary section
            const sumRowStart = startRow + mainData.length + 2;
            const summaries = [
                ['REKAPAN MODAL', totalModalAll],
                ['REKAPAN UNTUNG (KOTOR)', totalUntungKotorAll],
                ['REKAPAN RUGI (RETUR)', 0],
                ['TOTAL LABA BERSIH', totalUntungKotorAll - totalModalAll],
                ['TOTAL (MODAL + LABA BERSIH)', totalUntungKotorAll],
                ['PRODUK PALING LARIS', \`\${produkPalingLaris.nama} (Terjual \${produkPalingLaris.qty} pcs)\`]
            ];

            summaries.forEach((s, i) => {
                const r = sumRowStart + i;
                ws.getCell(r, 1).value = s[0];
                ws.getCell(r, 2).value = s[1];
                ws.mergeCells(\`A\${r}:B\${r}\`);
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell(r, 1).border = borderStyle;
                ws.getCell(r, 3).border = borderStyle;
                if (typeof s[1] === 'number') {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).numFmt = currencyFmt;
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'right' };
                } else {
                    ws.getCell(r, 3).value = s[1];
                    ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'left' };
                }
                ws.mergeCells(\`C\${r}:F\${r}\`);
            });

            ws.getColumn(1).width = 30; ws.getColumn(2).width = 15; 
            ws.getColumn(3).width = 20; ws.getColumn(4).width = 20; 
            ws.getColumn(5).width = 25; ws.getColumn(6).width = 20;
        }`
);

fs.writeFileSync('c:\\sipb-rumahan\\backend\\controllers\\adminController.js', code);
console.log('Update success');
