const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { initDb } = require('./db/init-db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// DB Connection
let db;
(async () => {
    db = await initDb();
})();

// Routes (Admin)
app.get('/', async (req, res) => {
    const stats = {
        totalRooms: (await db.get('SELECT COUNT(*) as count FROM rooms')).count,
        activeBookings: (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status IN ("pending", "approved", "checked_in")')).count,
        totalRevenue: (await db.get('SELECT SUM(amount) as sum FROM payments')).sum || 0
    };
    res.render('index', { page: 'overview', stats });
});

app.get('/bookings', async (req, res) => {
    const bookings = await db.all('SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.source = "walk-in" ORDER BY b.created_at DESC');
    const rooms = await db.all('SELECT * FROM rooms WHERE status = "available"');
    res.render('bookings', { page: 'walk-in', bookings, rooms });
});

app.post('/bookings', async (req, res) => {
    const { guest_name, guest_email, room_id, check_in_date, check_out_date, total_price } = req.body;
    await db.run('INSERT INTO bookings (guest_name, guest_email, room_id, check_in_date, check_out_date, status, source, total_price) VALUES (?, ?, ?, ?, ?, "approved", "walk-in", ?)', 
        [guest_name, guest_email, room_id, check_in_date, check_out_date, total_price]);
    await db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [room_id]);
    res.redirect('/bookings');
});

app.get('/requests', async (req, res) => {
    const requests = await db.all('SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.source = "online" ORDER BY b.created_at DESC');
    res.render('requests', { page: 'requests', requests });
});

app.get('/room-types', async (req, res) => {
    const types = await db.all('SELECT * FROM room_types');
    res.render('room-types', { page: 'room-types', types });
});

app.post('/room-types', async (req, res) => {
    const { name, description, base_price } = req.body;
    await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', [name, description, base_price]);
    res.redirect('/room-types');
});

app.get('/rooms', async (req, res) => {
    const rooms = await db.all('SELECT r.*, rt.name as type_name FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id');
    const types = await db.all('SELECT * FROM room_types');
    res.render('rooms', { page: 'rooms', rooms, types });
});

app.post('/rooms', async (req, res) => {
    const { room_number, room_type_id } = req.body;
    await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', [room_number, room_type_id]);
    res.redirect('/rooms');
});

// API for Frontend (Guest Site)
app.get('/api/rooms/available', async (req, res) => {
    const rooms = await db.all('SELECT r.*, rt.name as type_name, rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status = "available"');
    res.json(rooms);
});

app.post('/api/bookings', async (req, res) => {
    const { guest_name, guest_email, room_id, check_in_date, check_out_date, total_price } = req.body;
    await db.run('INSERT INTO bookings (guest_name, guest_email, room_id, check_in_date, check_out_date, status, source, total_price) VALUES (?, ?, ?, ?, ?, "pending", "online", ?)', 
        [guest_name, guest_email, room_id, check_in_date, check_out_date, total_price]);
    res.json({ success: true, message: 'Booking request sent.' });
});

app.listen(PORT, () => {
    console.log(`Admin Dashboard running at http://localhost:${PORT}`);
});
