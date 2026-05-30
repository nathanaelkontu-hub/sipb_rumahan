// generateHash.js
// Jalankan file ini SEKALI untuk generate hash password

const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('=================================');
    console.log('Password asli  :', password);
    console.log('Hash yang dibuat:', hash);
    console.log('=================================');
    console.log('');
    console.log('Copy SQL ini dan jalankan di phpMyAdmin:');
    console.log('');
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'admin@sipb.com';`);
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'budi@email.com';`);
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'sari@email.com';`);
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'andi@email.com';`);
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'rina@email.com';`);
    console.log(`UPDATE pelanggan SET password = '${hash}' WHERE email = 'doni@email.com';`);
}

generateHash();