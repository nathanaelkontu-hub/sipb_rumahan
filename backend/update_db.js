const db = require('./config/database');

async function updateDB() {
    try {
        await db.execute('ALTER TABLE pesanan MODIFY catatan TEXT;');
        console.log('Successfully updated catatan to TEXT.');
    } catch (error) {
        console.error('Error updating database:', error.message);
    } finally {
        process.exit(0);
    }
}

updateDB();
