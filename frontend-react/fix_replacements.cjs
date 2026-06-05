const fs = require('fs');
const path = require('path');

const files = [
  "src/pages/pelanggan/ProfilSaya.jsx",
  "src/pages/pelanggan/ChatAdmin.jsx",
  "src/pages/admin/LaporanKeuangan.jsx",
  "src/pages/admin/KoordinasiHarga.jsx",
  "src/pages/admin/DaftarPesanan.jsx",
  "src/layouts/PelangganLayout.jsx",
  "src/layouts/AdminLayout.jsx"
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (file === "src/pages/admin/LaporanKeuangan.jsx") {
    content = content.replace(
      /\$\{import\.meta\.env\.VITE_BASE_URL \|\| import\.meta\.env\.VITE_BASE_URL \+ ""\}\/api\/admin\/laporan\/excel/g,
      '${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/admin/laporan/excel'
    );
  } else {
    content = content.replace(
      /import\.meta\.env\.VITE_BASE_URL \|\| import\.meta\.env\.VITE_BASE_URL \+ ""/g,
      'import.meta.env.VITE_BASE_URL || "http://localhost:3000"'
    );
  }
  
  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed ' + file);
});
