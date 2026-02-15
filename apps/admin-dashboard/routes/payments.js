const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const { validate, paymentSchema } = require('../middleware/validate');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    // GET /payments - Financial records
    router.get('/payments', checkAuth, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (b.guest_name LIKE ? OR p.uuid LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const total = (await db.get(`
            SELECT COUNT(*) as count FROM payments p 
            JOIN bookings b ON p.booking_id = b.id 
            WHERE ${whereClause}
        `, params)).count;

        const payments = await db.all(`
            SELECT p.*, b.guest_name, b.phone_number, b.total_price as booking_total, b.uuid as booking_uuid,
                   r.room_number
            FROM payments p 
            JOIN bookings b ON p.booking_id = b.id
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE ${whereClause}
            ORDER BY p.created_at DESC 
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get bookings with outstanding balances
        const unpaidBookings = await db.all(`
            SELECT b.id, b.uuid, b.guest_name, b.phone_number, b.total_price as room_rate, r.room_number,
                   COALESCE((SELECT SUM(amount) FROM room_charges WHERE booking_id = b.id), 0) as extra_charges,
                   COALESCE((SELECT SUM(amount) FROM payments WHERE booking_id = b.id), 0) as paid_amount
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.status IN ('approved', 'checked_in', 'checked_out')
            AND b.room_id IS NOT NULL
        `);

        // Calculate dynamic balances in JS for clarity and handling edge cases
        unpaidBookings.forEach(b => {
            b.total_payable = b.room_rate + b.extra_charges;
            b.balance = b.total_payable - b.paid_amount;
        });

        const filteredUnpaid = unpaidBookings.filter(b => b.balance > 0.01).sort((a,b) => b.balance - a.balance);

        // Summary stats
        const totalCollectedData = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
        const todayCollectedData = await db.get("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date(created_at) = date('now')");
        const paymentCountData = await db.get('SELECT COUNT(*) as count FROM payments');

        const stats = {
            totalCollected: totalCollectedData.total,
            todayCollected: todayCollectedData.total,
            outstandingBalance: unpaidBookings.reduce((sum, b) => sum + Math.max(0, b.balance), 0),
            paymentCount: paymentCountData.count,
            byMethod: await db.all('SELECT payment_method, SUM(amount) as total FROM payments GROUP BY payment_method')
        };

        res.render('payments', { 
            page: 'payments', payments, unpaidBookings: filteredUnpaid, stats,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total },
            search,
            error: req.query.error || null
        });
    });

    // POST /payments - Record a payment
    router.post('/payments', checkAuth, validate(paymentSchema), async (req, res) => {
        const { booking_id, amount, payment_method, notes } = req.validatedBody;
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get(`
                SELECT b.*, 
                COALESCE((SELECT SUM(amount) FROM room_charges WHERE booking_id = b.id), 0) as extra_charges,
                COALESCE((SELECT SUM(amount) FROM payments WHERE booking_id = b.id), 0) as paid_amount
                FROM bookings b WHERE b.id = ?
            `, [booking_id]);

            if (!booking) throw new Error('Booking not found');

            const totalPayable = booking.total_price + booking.extra_charges;
            const balance = totalPayable - booking.paid_amount;
            
            if (amount > balance + 0.05) throw new Error(`Payment exceeds balance. Outstanding: $${balance.toFixed(2)}`);

            const uuid = uuidv4();
            await db.run(`
                INSERT INTO payments (uuid, booking_id, amount, payment_method, notes, recorded_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [uuid, booking_id, amount, payment_method, notes, res.locals.user.id]);

            await audit.log(res.locals.user.id, 'CREATE', 'payments', null, null, { 
                booking_id, amount, payment_method, booking_guest: booking.guest_name 
            });

            await db.run('COMMIT');
            res.redirect('/payments');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[PAYMENT_ERROR]:', error);
            res.redirect(`/payments?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
