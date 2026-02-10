const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { initDb } = require('./db/init-db');

const app = express();
const PORT = 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'hotel-elysian-enterprise-v2',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let db;
(async () => { db = await initDb(); })();

// --- HELPERS ---
const calculateStayPrice = (checkIn, checkOut, basePrice) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(nights, 1) * basePrice;
};

// --- AUTH ---
const auth = (req, res, next) => req.session.user ? next() : res.redirect('/login');
const adminOnly = (req, res, next) => (req.session.user && req.session.user.role === 'admin') ? next() : res.status(403).send('Forbidden');

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        return res.redirect('/');
    }
    res.render('login', { error: 'Access Denied' });
});
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.use((req, res, next) => { res.locals.user = req.session.user; next(); });

// --- ENHANCED DASHBOARD ---
app.get('/', auth, async (req, res) => {
    const totalRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1')).count;
    const occupiedRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "occupied"')).count;
    const pendingRequests = (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"')).count;
    const revenueData = await db.get('SELECT SUM(total_price) as sum FROM bookings WHERE status = "approved"');
    
    const stats = {
        totalRooms,
        occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        pendingRequests,
        revenue: revenueData.sum || 0,
        recentBookings: await db.all('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5')
    };
    res.render('index', { page: 'overview', stats });
});

// --- BOOKINGS (WALK-IN & LIST) ---
app.get('/bookings', auth, async (req, res) => {
    const bookings = await db.all('SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC');
    const rooms = await db.all('SELECT * FROM rooms WHERE status = "available" AND is_active = 1');
    res.render('bookings', { page: 'walk-in', bookings, rooms });
});

app.post('/bookings', auth, async (req, res) => {
    const { guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, total_price } = req.body;
    await db.run('INSERT INTO bookings (guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price) VALUES (?, ?, ?, ?, ?, ?, "approved", "walk-in", ?)', 
        [guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, total_price]);
    await db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [room_id]);
    res.redirect('/bookings');
});

// --- REQUESTS ---
app.get('/requests', auth, async (req, res) => {
    const requests = await db.all(`
        SELECT b.*, r.room_number, rt.name as type_name, rt.base_price 
        FROM bookings b 
        LEFT JOIN rooms r ON b.room_id = r.id 
        LEFT JOIN room_types rt ON r.room_type_id = rt.id 
        WHERE b.source = "online" 
        ORDER BY b.created_at DESC
    `);
    res.render('requests', { page: 'requests', requests });
});

app.post('/requests/:id/approve', auth, async (req, res) => {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) return res.redirect('/requests?error=not_found');

    // SYNC CHECK: Verify room is still available before proceeding
    const room = await db.get('SELECT status FROM rooms WHERE id = ?', [booking.room_id]);
    if (room.status !== 'available') {
        await db.run('UPDATE bookings SET status = "rejected", special_requests = "[SYSTEM: Auto-rejected due to room unavailability]" WHERE id = ?', [req.params.id]);
        return res.redirect('/requests?error=room_taken');
    }

    await db.run('UPDATE bookings SET status = "approved" WHERE id = ?', [req.params.id]);
    await db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [booking.room_id]);
    
    // Auto-generate payment record
    await db.run('INSERT INTO payments (booking_id, amount, payment_method) VALUES (?, ?, "pending")', [booking.id, booking.total_price]);
    
    res.redirect('/requests');
});

// --- INVENTORY ---
app.get('/room-types', auth, async (req, res) => {
    const types = await db.all('SELECT * FROM room_types');
    res.render('room-types', { page: 'room-types', types });
});

app.post('/room-types', auth, async (req, res) => {
    const { id, name, description, base_price, is_active } = req.body;
    if (id) {
        await db.run('UPDATE room_types SET name = ?, description = ?, base_price = ?, is_active = ? WHERE id = ?', [name, description, base_price, is_active ? 1 : 0, id]);
    } else {
        await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', [name, description, base_price]);
    }
    res.redirect('/room-types');
});

app.get('/rooms', auth, async (req, res) => {
    const rooms = await db.all('SELECT r.*, rt.name as type_name FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id');
    const types = await db.all('SELECT * FROM room_types WHERE is_active = 1');
    res.render('rooms', { page: 'rooms', rooms, types });
});

app.post('/rooms', auth, async (req, res) => {
    const { id, room_number, room_type_id, status, is_active } = req.body;
    if (id) {
        await db.run('UPDATE rooms SET room_number = ?, room_type_id = ?, status = ?, is_active = ? WHERE id = ?', [room_number, room_type_id, status, is_active ? 1 : 0, id]);
    } else {
        await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', [room_number, room_type_id]);
    }
    res.redirect('/rooms');
});

// --- RESTAURANT ---
app.get('/restaurant-admin', auth, async (req, res) => {
    const menu = await db.all('SELECT * FROM menu_items ORDER BY category');
    res.render('restaurant-admin', { page: 'restaurant', menu });
});

app.post('/restaurant-admin', auth, async (req, res) => {
    const { id, category, name, description, price, is_available } = req.body;
    if (id) {
        await db.run('UPDATE menu_items SET category = ?, name = ?, description = ?, price = ?, is_available = ? WHERE id = ?', [category, name, description, price, is_available ? 1 : 0, id]);
    } else {
        await db.run('INSERT INTO menu_items (category, name, description, price) VALUES (?, ?, ?, ?)', [category, name, description, price]);
    }
    res.redirect('/restaurant-admin');
});

// --- DEDICATED REPORTS SECTION ---
app.get('/reports', auth, async (req, res) => {
    // 1. Revenue by Room Type
    const revenueByType = await db.all(`
        SELECT rt.name, SUM(b.total_price) as total 
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
        JOIN room_types rt ON r.room_type_id = rt.id 
        WHERE b.status = 'approved'
        GROUP BY rt.name
    `);

    // 2. Booking Sources Distribution
    const sources = await db.all(`
        SELECT source, COUNT(*) as count 
        FROM bookings 
        GROUP BY source
    `);

    // 3. Monthly Trend (Last 6 months)
    const monthlyTrend = await db.all(`
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count, SUM(total_price) as revenue
        FROM bookings 
        WHERE status = 'approved'
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 6
    `);

    // 4. Room Occupancy Status
    const roomStatus = await db.all(`
        SELECT status, COUNT(*) as count 
        FROM rooms 
        GROUP BY status
    `);

    res.render('reports', { 
        page: 'reports', 
        analytics: {
            revenueByType,
            sources,
            monthlyTrend,
            roomStatus
        }
    });
});

// --- STAFF ---
app.get('/staff', auth, adminOnly, async (req, res) => {
    const staff = await db.all('SELECT id, username, full_name, role, created_at FROM users');
    res.render('staff', { page: 'staff', staff });
});

app.post('/staff', auth, adminOnly, async (req, res) => {
    const { username, password, full_name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', [username, hashedPassword, full_name, role]);
    res.redirect('/staff');
});

// --- REPORTS ---
app.get('/reports/excel', auth, async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bookings');
    sheet.columns = [
        { header: 'ID', key: 'id' }, { header: 'Guest', key: 'guest_name' }, { header: 'Phone', key: 'phone_number' },
        { header: 'Telegram', key: 'telegram' }, { header: 'Check-in', key: 'check_in_date' }, { header: 'Status', key: 'status' }
    ];
    sheet.addRows(await db.all('SELECT * FROM bookings'));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
    await workbook.xlsx.write(res);
    res.end();
});

app.get('/bookings/:id/invoice', auth, async (req, res) => {
    const booking = await db.get('SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?', [req.params.id]);
    if (!booking) return res.status(404).send('Not Found');
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${booking.id}.pdf`);
    doc.pipe(res);
    doc.fontSize(25).text('ELYSIAN HOTEL INVOICE', { align: 'center' });
    doc.moveDown().fontSize(12).text(`Booking ID: ${booking.id}`).text(`Guest: ${booking.guest_name}`).text(`Phone: ${booking.phone_number}`).text(`Telegram: ${booking.telegram}`).text(`Room: ${booking.room_number}`).moveDown().fontSize(18).text(`TOTAL: $${booking.total_price.toFixed(2)}`, { align: 'right' });
    doc.end();
});

// --- GUEST API ---
app.get('/api/rooms/available', async (req, res) => {
    const rooms = await db.all('SELECT r.*, rt.name as type_name, rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status = "available" AND r.is_active = 1 AND rt.is_active = 1');
    res.json(rooms);
});

app.get('/api/restaurant/menu', async (req, res) => {
    res.json(await db.all('SELECT * FROM menu_items WHERE is_available = 1'));
});

app.post('/api/bookings', async (req, res) => {
    const { guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, special_requests } = req.body;
    
    const roomType = await db.get('SELECT rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?', [room_id]);
    const totalPrice = calculateStayPrice(check_in_date, check_out_date, roomType.base_price);

    const existing = await db.get('SELECT id FROM bookings WHERE (phone_number = ? OR telegram = ?) AND status = "pending"', [phone_number, telegram]);
    if (existing) return res.status(429).json({ success: false, message: 'Pending request exists.' });

    await db.run('INSERT INTO bookings (guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price, special_requests) VALUES (?, ?, ?, ?, ?, ?, "pending", "online", ?, ?)', 
        [guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, totalPrice, special_requests]);
    
    res.json({ success: true, totalPrice });
});

app.listen(PORT, () => console.log(`Elysian Intelligence Active on ${PORT}`));