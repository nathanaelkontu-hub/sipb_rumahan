const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/laporan/excel?tipe=ringkasan&tgl_mulai=2024-01-01&tgl_selesai=2026-12-31',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', data.slice(0, 100)); // print first 100 chars
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
