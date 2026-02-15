const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class SeedingService {
    constructor(db) {
        this.db = db;
    }

    async seedAll() {
        console.log('[SEED] Starting controlled data seeding...');
        await this.db.run('BEGIN TRANSACTION');
        try {
            await this.seedRoomTypes();
            await this.seedRooms();
            await this.seedGuests();
            await this.seedBookingsAndPayments();
            await this.seedMenuItems();
            await this.db.run('COMMIT');
            console.log('[SEED] Successfully seeded database.');
        } catch (error) {
            await this.db.run('ROLLBACK');
            console.error('[SEED_ERROR]:', error);
            throw error;
        }
    }

    async seedRoomTypes() {
        const types = [
            { name: 'Royal Suite', desc: 'Penthouse level with private terrace and butler service.', price: 1200 },
            { name: 'Executive Silk', desc: 'King bed, marble bath, and panoramic city views.', price: 450 },
            { name: 'Deluxe Stone', desc: 'Modern minimalist design with high-end amenities.', price: 280 }
        ];

        for (const t of types) {
            const existing = await this.db.get('SELECT id FROM room_types WHERE name = ?', [t.name]);
            if (!existing) {
                await this.db.run(
                    'INSERT INTO room_types (uuid, name, description, base_price) VALUES (?, ?, ?, ?)',
                    [uuidv4(), t.name, t.desc, t.price]
                );
            }
        }
    }

    async seedRooms() {
        const types = await this.db.all('SELECT id FROM room_types');
        for (let i = 1; i <= 15; i++) {
            const roomNum = (100 + i).toString();
            const existing = await this.db.get('SELECT id FROM rooms WHERE room_number = ?', [roomNum]);
            if (!existing) {
                const type = types[Math.floor(Math.random() * types.length)];
                await this.db.run(
                    'INSERT INTO rooms (uuid, room_number, room_type_id, status) VALUES (?, ?, ?, ?)',
                    [uuidv4(), roomNum, type.id, 'available']
                );
            }
        }
    }

    async seedGuests() {
        const count = await this.db.get('SELECT COUNT(*) as count FROM guests');
        if (count.count < 10) {
            for (let i = 0; i < 15; i++) {
                const firstName = faker.person.firstName();
                const lastName = faker.person.lastName();
                await this.db.run(
                    'INSERT OR IGNORE INTO guests (uuid, full_name, phone_number, email, telegram, is_vip) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), `${firstName} ${lastName}`, faker.phone.number(), faker.internet.email({firstName, lastName}), `@${firstName.toLowerCase()}${faker.number.int(99)}`, Math.random() > 0.8]
                );
            }
        }
    }

    async seedBookingsAndPayments() {
        const guests = await this.db.all('SELECT * FROM guests');
        const rooms = await this.db.all('SELECT r.*, rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id');
        
        const count = await this.db.get('SELECT COUNT(*) as count FROM bookings');
        if (count.count > 5) return; // Only seed if empty-ish

        for (let i = 0; i < 20; i++) {
            const guest = guests[Math.floor(Math.random() * guests.length)];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const status = faker.helpers.arrayElement(['checked_out', 'checked_in', 'approved', 'pending']);
            
            const checkIn = faker.date.between({ from: '2026-01-01', to: '2026-02-15' });
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 5 }));

            const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
            const total = nights * room.base_price;
            const method = faker.helpers.arrayElement(['cash', 'card', 'bank_transfer']);

            const result = await this.db.run(`
                INSERT INTO bookings (uuid, guest_id, guest_name, phone_number, room_id, check_in_date, check_out_date, status, source, total_price, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), guest.id, guest.full_name, guest.phone_number, room.id, 
                checkIn.toISOString().split('T')[0], checkOut.toISOString().split('T')[0],
                status, faker.helpers.arrayElement(['online', 'walk-in']), total, method
            ]);

            if (status === 'checked_out' || status === 'checked_in') {
                await this.db.run(
                    'INSERT INTO payments (uuid, booking_id, amount, payment_method, recorded_by) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), result.lastID, total, method, 1]
                );
            }
        }
    }

    async seedMenuItems() {
        const menu = [
            { cat: 'food', name: 'Wagyu Ribeye', desc: 'A5 Grade with truffle mash.', price: 145 },
            { cat: 'food', name: 'Lobster Risotto', desc: 'Carnaroli rice, saffron, lobster medallions.', price: 65 },
            { cat: 'wine', name: 'Opus One 2018', desc: 'Napa Valley Red Blend.', price: 550 },
            { cat: 'deserts', name: 'Gold Leaf Soufflé', desc: '24k gold, dark chocolate.', price: 32 }
        ];

        for (const item of menu) {
            const existing = await this.db.get('SELECT id FROM menu_items WHERE name = ?', [item.name]);
            if (!existing) {
                await this.db.run(
                    'INSERT INTO menu_items (uuid, category, name, description, price) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), item.cat, item.name, item.desc, item.price]
                );
            }
        }
    }
}

module.exports = SeedingService;
