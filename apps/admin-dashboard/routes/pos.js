const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    // GET /pos - Point of Sale interface
    router.get('/pos', checkAuth, async (req, res) => {
        const menu = await db.all('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name');
        const activeBookings = await db.all(`
            SELECT b.id, b.guest_name, r.room_number 
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            WHERE b.status = 'checked_in'
            ORDER BY r.room_number ASC
        `);

        res.render('pos', { page: 'pos', menu, activeBookings, error: req.query.error || null });
    });

    // POST /pos/charge - Record a charge to a room
    router.post('/pos/charge', checkAuth, async (req, res) => {
        const { booking_id, item_id, quantity = 1 } = req.body;
        try {
            const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [item_id]);
            if (!item) throw new Error('Menu item not found');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [booking_id]);
            if (!booking) throw new Error('Active booking not found');
            if (booking.status !== 'checked_in') throw new Error('Guest is not currently checked in');

            const totalAmount = item.price * parseInt(quantity);
            const uuid = uuidv4();

            await db.run(`
                INSERT INTO room_charges (uuid, booking_id, item_name, amount, category, recorded_by)
                VALUES (?, ?, ?, ?, 'restaurant', ?)
            `, [uuid, booking_id, `${item.name} (x${quantity})`, totalAmount, res.locals.user.id]);

            await audit.log(res.locals.user.id, 'CREATE', 'room_charges', null, null, { 
                booking_id, item: item.name, amount: totalAmount 
            });

            res.redirect('/pos?success=1');
        } catch (error) {
            console.error('[POS_ERROR]:', error);
            res.redirect(`/pos?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
