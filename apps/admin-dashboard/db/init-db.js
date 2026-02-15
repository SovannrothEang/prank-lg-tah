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

    await db.get('PRAGMA foreign_keys = ON');

    await db.exec(`
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

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            table_name TEXT,
            record_id INTEGER,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

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

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            booking_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'bank_transfer', 'online')) NOT NULL,
            notes TEXT,
            recorded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(booking_id) REFERENCES bookings(id),
            FOREIGN KEY(recorded_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS amenities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT DEFAULT 'star',
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS room_type_amenities (
            room_type_id INTEGER NOT NULL,
            amenity_id INTEGER NOT NULL,
            PRIMARY KEY(room_type_id, amenity_id),
            FOREIGN KEY(room_type_id) REFERENCES room_types(id),
            FOREIGN KEY(amenity_id) REFERENCES amenities(id)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            phone_number TEXT UNIQUE NOT NULL,
            email TEXT,
            telegram TEXT,
            internal_notes TEXT,
            is_vip BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS room_charges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            booking_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT DEFAULT 'restaurant',
            recorded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(booking_id) REFERENCES bookings(id),
            FOREIGN KEY(recorded_by) REFERENCES users(id)
        );
    `);

    const addColumn = async (tableName, columnName, typeDefinition) => {
        const columns = await db.all(`PRAGMA table_info(${tableName})`);
        if (!columns.find(c => c.name === columnName)) {
            console.log(`[MIGRATE] Adding ${columnName} to ${tableName}`);
            await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${typeDefinition}`);
            
            if (columnName === 'uuid') {
                const rows = await db.all(`SELECT id FROM ${tableName} WHERE uuid IS NULL`);
                for (const row of rows) {
                    await db.run(`UPDATE ${tableName} SET uuid = ? WHERE id = ?`, [uuidv4(), row.id]);
                }
            }
        }
    };

    // Users
    await addColumn('users', 'uuid', 'TEXT');
    await addColumn('users', 'session_id', 'TEXT');
    await addColumn('users', 'is_active', 'BOOLEAN DEFAULT 1');
    await addColumn('users', 'updated_at', 'DATETIME');

    // Room Types
    await addColumn('room_types', 'uuid', 'TEXT');
    await addColumn('room_types', 'deleted_at', 'DATETIME');
    await addColumn('room_types', 'updated_at', 'DATETIME');

    // Rooms
    await addColumn('rooms', 'uuid', 'TEXT');
    await addColumn('rooms', 'deleted_at', 'DATETIME');
    await addColumn('rooms', 'updated_at', 'DATETIME');

    // Bookings
    await addColumn('bookings', 'uuid', 'TEXT');
    await addColumn('bookings', 'guest_email', 'TEXT');
    await addColumn('bookings', 'internal_notes', 'TEXT');
    await addColumn('bookings', 'payment_method', 'TEXT');
    await addColumn('bookings', 'guest_id', 'INTEGER');
    await addColumn('bookings', 'updated_at', 'DATETIME');

    // Menu Items
    await addColumn('menu_items', 'uuid', 'TEXT');

    // Payments
    await addColumn('payments', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // Backfill missing UUIDs across all tables
    const tablesToBackfill = ['users', 'room_types', 'rooms', 'bookings', 'menu_items', 'guests', 'room_charges'];
    for (const table of tablesToBackfill) {
        const columns = await db.all(`PRAGMA table_info(${table})`);
        if (!columns.find(c => c.name === 'uuid')) continue;
        
        const rows = await db.all(`SELECT id FROM ${table} WHERE uuid IS NULL OR uuid = ''`);
        for (const row of rows) {
            await db.run(`UPDATE ${table} SET uuid = ? WHERE id = ?`, [uuidv4(), row.id]);
        }
    }

    // CRM Migration: Move unique guest data from bookings to guests table
    const orphanedBookings = await db.all('SELECT * FROM bookings WHERE guest_id IS NULL');
    for (const booking of orphanedBookings) {
        let guest = await db.get('SELECT id FROM guests WHERE phone_number = ?', [booking.phone_number]);
        
        if (!guest) {
            const guestUuid = uuidv4();
            // Skip migration if phone_number is missing to avoid constraint failure
            if (!booking.phone_number) {
                console.warn(`[MIGRATE] Skipping orphaned booking ID ${booking.id} due to missing phone number`);
                continue;
            }
            const result = await db.run(
                'INSERT INTO guests (uuid, full_name, phone_number, email, telegram) VALUES (?, ?, ?, ?, ?)',
                [guestUuid, booking.guest_name, booking.phone_number, booking.guest_email, booking.telegram]
            );
            guest = { id: result.lastID };
        }
        
        await db.run('UPDATE bookings SET guest_id = ? WHERE id = ?', [guest.id, booking.id]);
    }

    // Seed Admin
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run('INSERT INTO users (uuid, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)', 
            [uuidv4(), 'admin', hashedPassword, 'System Administrator', 'admin']);
    }

    console.log('Database Fully Synchronized & Migrated.');
    return db;
}

module.exports = { initDb };

if (require.main === module) {
    initDb().catch(err => {
        console.error(err);
        process.exit(1);
    });
}