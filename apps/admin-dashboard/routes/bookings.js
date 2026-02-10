const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { auth } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    const calculateStayPrice = (checkIn, checkOut, basePrice) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
        return nights * basePrice;
    };

    router.get('/bookings', checkAuth, async (req, res) => {
        const bookings = await db.all('SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC');
        const rooms = await db.all('SELECT * FROM rooms WHERE status = "available" AND is_active = 1 AND deleted_at IS NULL');
        res.render('bookings', { page: 'walk-in', bookings, rooms });
    });

    // POST /bookings (Walk-in)
    // Enterprise Standard: Transactional + Audited
    router.post('/bookings', checkAuth, async (req, res) => {
        const { guest_name, phone_number, telegram, room_id, check_in_date, check_out_date } = req.body;
        
        try {
            await db.run('BEGIN TRANSACTION');

            const room = await db.get('SELECT rt.base_price, r.uuid FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?', [room_id]);
            const totalPrice = calculateStayPrice(check_in_date, check_out_date, room.base_price);

            const { v4: uuidv4 } = require('uuid');
            const bookingUuid = uuidv4();

            await db.run(`
                INSERT INTO bookings (uuid, guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 'walk-in', ?)
            `, [bookingUuid, guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, totalPrice]);

            await db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [room_id]);

            await audit.log(req.session.user.id, 'CREATE', 'bookings', null, null, { guest_name, room_id, totalPrice });
            
            await db.run('COMMIT');
            res.redirect('/bookings');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[WALK_IN_ERROR]:', error);
            res.redirect('/bookings?error=transaction_failed');
        }
    });

    router.get('/requests', checkAuth, async (req, res) => {
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

    // POST /requests/:id/approve
    // Enterprise Standard: Transactional verification
    router.post('/requests/:id/approve', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');

            const room = await db.get('SELECT status FROM rooms WHERE id = ?', [booking.room_id]);
            if (room.status !== 'available') {
                throw new Error('Room conflict detected during sync');
            }

            await db.run('UPDATE bookings SET status = "approved" WHERE id = ?', [req.params.id]);
            await db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [booking.room_id]);

            await audit.log(req.session.user.id, 'UPDATE', 'bookings', booking.id, { status: 'pending' }, { status: 'approved' });

            await db.run('COMMIT');
            res.redirect('/requests');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[APPROVAL_ERROR]:', error);
            res.redirect(`/requests?error=${encodeURIComponent(error.message)}`);
        }
    });

    router.post('/requests/:id/reject', checkAuth, async (req, res) => {
        await db.run('UPDATE bookings SET status = "rejected" WHERE id = ?', [req.params.id]);
        await audit.log(req.session.user.id, 'UPDATE', 'bookings', req.params.id, { status: 'pending' }, { status: 'rejected' });
        res.redirect('/requests');
    });

    router.get('/bookings/:id/invoice', checkAuth, async (req, res) => {
        const b = await db.get('SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?', [req.params.id]);
        if (!b) return res.status(404).send('Not Found');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${b.id}.pdf`);
        doc.pipe(res);
        doc.fontSize(25).text('ELYSIAN HOTEL INVOICE', { align: 'center' });
        doc.moveDown().fontSize(12).text(`REF: ${b.uuid}`).text(`Guest: ${b.guest_name}`).text(`Phone: ${b.phone_number}`).text(`Room: ${b.room_number}`).text(`Dates: ${b.check_in_date} to ${b.check_out_date}`).moveDown().fontSize(18).text(`TOTAL: $${b.total_price.toFixed(2)}`, { align: 'right' });
        doc.end();
    });

    return router;
};