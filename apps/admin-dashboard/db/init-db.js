const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'hotel.db'),
        driver: sqlite3.Database
    });

    // Enable Foreign Keys
    await db.get('PRAGMA foreign_keys = ON');

    await db.exec(`
        -- USERS & AUTH
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            role TEXT CHECK(role IN ('admin', 'manager', 'staff')) DEFAULT 'staff',
            session_id TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- INVENTORY CATEGORIES
        CREATE TABLE IF NOT EXISTS room_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            deleted_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- PHYSICAL ASSETS
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            room_number TEXT UNIQUE NOT NULL,
            room_type_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('available', 'occupied', 'maintenance', 'dirty')) DEFAULT 'available',
            is_active BOOLEAN DEFAULT 1,
            deleted_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_type_id) REFERENCES room_types(id)
        );

        -- BOOKINGS (THE CORE ENGINE)
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            guest_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            telegram TEXT,
            guest_email TEXT,
            room_id INTEGER NOT NULL,
            check_in_date DATE NOT NULL,
            check_out_date DATE NOT NULL,
            status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'pending',
            source TEXT CHECK(source IN ('online', 'walk-in')) DEFAULT 'online',
            total_price REAL NOT NULL,
            special_requests TEXT,
            internal_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_id) REFERENCES rooms(id)
        );

        -- AUDIT SYSTEM (NON-NEGOTIABLE FOR ENTERPRISE)
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN
            table_name TEXT,
            record_id INTEGER,
            old_value TEXT, -- JSON string
            new_value TEXT, -- JSON string
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        -- GASTRONOMY
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            category TEXT CHECK(category IN ('food', 'deserts', 'wine')) NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Enterprise Seed: Admin User
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run('INSERT INTO users (uuid, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)', 
            [uuidv4(), 'admin', hashedPassword, 'System Administrator', 'admin']);
        console.log('[SEED] Default Enterprise Admin created.');
    }

    console.log('✅ Enterprise Schema Synchronized.');
    return db;
}

module.exports = { initDb };