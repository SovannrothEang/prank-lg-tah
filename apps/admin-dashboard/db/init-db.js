const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function initDb() {
    const db = await open({
        filename: path.join(__dirname, 'hotel.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS room_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS amenities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT
        );

        CREATE TABLE IF NOT EXISTS room_type_amenities (
            room_type_id INTEGER,
            amenity_id INTEGER,
            FOREIGN KEY(room_type_id) REFERENCES room_types(id),
            FOREIGN KEY(amenity_id) REFERENCES amenities(id),
            PRIMARY KEY(room_type_id, amenity_id)
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            room_type_id INTEGER,
            status TEXT DEFAULT 'available', -- available, occupied, maintenance
            FOREIGN KEY(room_type_id) REFERENCES room_types(id)
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guest_name TEXT NOT NULL,
            guest_email TEXT,
            room_id INTEGER,
            check_in_date TEXT NOT NULL,
            check_out_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, approved, rejected, checked_in, checked_out, cancelled
            source TEXT DEFAULT 'online', -- online, walk-in
            total_price REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_id) REFERENCES rooms(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER,
            amount REAL NOT NULL,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            payment_method TEXT, -- cash, card, online
            FOREIGN KEY(booking_id) REFERENCES bookings(id)
        );
    `);

    // Seed some data if empty
    const roomTypes = await db.all('SELECT * FROM room_types');
    if (roomTypes.length === 0) {
        await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', ['Standard', 'A cozy standard room', 100]);
        await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', ['Deluxe', 'Spacious deluxe room with view', 200]);
        await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', ['Suite', 'Luxury suite for premium stay', 450]);

        await db.run('INSERT INTO amenities (name) VALUES (?)', ['Free Wi-Fi']);
        await db.run('INSERT INTO amenities (name) VALUES (?)', ['Air Conditioning']);
        await db.run('INSERT INTO amenities (name) VALUES (?)', ['Mini Bar']);
        
        await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', ['101', 1]);
        await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', ['102', 1]);
        await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', ['201', 2]);
        await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', ['301', 3]);
    }

    console.log('Database initialized successfully.');
    return db;
}

if (require.main === module) {
    initDb().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { initDb };
