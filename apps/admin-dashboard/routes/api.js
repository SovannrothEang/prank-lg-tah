const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/api/rooms/available', async (req, res) => {
        const rooms = await db.all('SELECT r.*, rt.name as type_name, rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status = "available" AND r.is_active = 1 AND rt.is_active = 1');
        res.json(rooms);
    });

    router.get('/api/restaurant/menu', async (req, res) => {
        const items = await db.all('SELECT * FROM menu_items WHERE is_available = 1');
        res.json(items);
    });

    router.post('/api/bookings', async (req, res) => {
        const { guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, special_requests } = req.body;
        
        const existing = await db.get('SELECT id FROM bookings WHERE (phone_number = ? OR telegram = ?) AND status = "pending"', [phone_number, telegram]);
        if (existing) return res.status(429).json({ success: false, message: 'Pending request exists.' });

        const room = await db.get('SELECT rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?', [room_id]);
        const start = new Date(check_in_date);
        const end = new Date(check_out_date);
        const nights = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
        const totalPrice = nights * room.base_price;

        await db.run('INSERT INTO bookings (guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price, special_requests) VALUES (?, ?, ?, ?, ?, ?, "pending", "online", ?, ?)', 
            [guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, totalPrice, special_requests]);
        
        res.json({ success: true });
    });

    return router;
};
