const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'hotel.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'staff',
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS room_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL,
            is_active BOOLEAN DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            room_type_id INTEGER,
            status TEXT DEFAULT 'available',
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY(room_type_id) REFERENCES room_types(id)
        );

        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            is_available BOOLEAN DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guest_name TEXT NOT NULL,
            guest_email TEXT,
            phone_number TEXT,
            telegram TEXT,
            room_id INTEGER,
            check_in_date TEXT NOT NULL,
            check_out_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            source TEXT DEFAULT 'online',
            total_price REAL,
            special_requests TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_id) REFERENCES rooms(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER,
            amount REAL NOT NULL,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            payment_method TEXT,
            FOREIGN KEY(booking_id) REFERENCES bookings(id)
        );
    `);

    // --- MIGRATIONS ---
    try { await db.exec(`ALTER TABLE room_types ADD COLUMN is_active BOOLEAN DEFAULT 1`); } catch(e) {}
    try { await db.exec(`ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT 1`); } catch(e) {}
    try { await db.exec(`ALTER TABLE users ADD COLUMN session_id TEXT`); } catch(e) {}
    try { await db.exec(`ALTER TABLE bookings ADD COLUMN phone_number TEXT`); } catch(e) {}
    try { await db.exec(`ALTER TABLE bookings ADD COLUMN telegram TEXT`); } catch(e) {}
    try { await db.exec(`ALTER TABLE bookings ADD COLUMN special_requests TEXT`); } catch(e) {}

    // Seed Admin
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', 
            ['admin', hashedPassword, 'System Administrator', 'admin']);
    }

    console.log('Enterprise Database Synchronized & Migrated.');
    return db;
}

module.exports = { initDb };

if (require.main === module) {
    initDb().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
