const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const { validate, bookingSchema } = require('../middleware/validate');
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

    // GET /bookings - List all bookings with search & pagination
    router.get('/bookings', checkAuth, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (b.guest_name LIKE ? OR b.phone_number LIKE ? OR r.room_number LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (statusFilter) {
            whereClause += ' AND b.status = ?';
            params.push(statusFilter);
        }

        const total = (await db.get(`SELECT COUNT(*) as count FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE ${whereClause}`, params)).count;
        const bookings = await db.all(`
            SELECT b.*, r.room_number, rt.name as type_name 
            FROM bookings b 
            LEFT JOIN rooms r ON b.room_id = r.id 
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE ${whereClause} 
            ORDER BY b.created_at DESC 
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        const rooms = await db.all('SELECT r.*, rt.name as type_name FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status = "available" AND r.is_active = 1 AND r.deleted_at IS NULL');
        
        res.render('bookings', { 
            page: 'walk-in', bookings, rooms,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total },
            search, statusFilter,
            error: req.query.error || null
        });
    });

    // POST /bookings (Walk-in) - Transactional + Audited + Validated
    router.post('/bookings', checkAuth, validate(bookingSchema), async (req, res) => {
        const { guest_name, phone_number, telegram, guest_email, room_id, check_in_date, check_out_date, payment_method, special_requests } = req.validatedBody;
        
        try {
            await db.run('BEGIN TRANSACTION');

            const room = await db.get('SELECT r.id, r.status, rt.base_price, r.uuid FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?', [room_id]);
            if (!room) throw new Error('Room not found');
            if (room.status !== 'available') throw new Error('Room is not available');

            const totalPrice = calculateStayPrice(check_in_date, check_out_date, room.base_price);
            const bookingUuid = uuidv4();

            // Find or create guest
            let guest = await db.get('SELECT id FROM guests WHERE phone_number = ?', [phone_number]);
            if (!guest) {
                const guestUuid = uuidv4();
                const guestResult = await db.run(
                    'INSERT INTO guests (uuid, full_name, phone_number, email, telegram) VALUES (?, ?, ?, ?, ?)',
                    [guestUuid, guest_name, phone_number, guest_email, telegram]
                );
                guest = { id: guestResult.lastID };
            } else {
                // Update existing guest info if provided
                await db.run(
                    'UPDATE guests SET full_name = ?, email = ?, telegram = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [guest_name, guest_email, telegram, guest.id]
                );
            }

            await db.run(`
                INSERT INTO bookings (uuid, guest_name, phone_number, telegram, guest_email, room_id, guest_id, check_in_date, check_out_date, status, source, total_price, payment_method, special_requests)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'walk-in', ?, ?, ?)
            `, [bookingUuid, guest_name, phone_number, telegram, guest_email, room_id, guest.id, check_in_date, check_out_date, totalPrice, payment_method, special_requests]);

            await db.run('UPDATE rooms SET status = "occupied", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [room_id]);

            await audit.log(res.locals.user.id, 'CREATE', 'bookings', null, null, { guest_name, room_id, totalPrice, payment_method });
            
            // Also create a payment record
            const paymentUuid = uuidv4();
            const booking = await db.get('SELECT id FROM bookings WHERE uuid = ?', [bookingUuid]);
            await db.run(`
                INSERT INTO payments (uuid, booking_id, amount, payment_method, recorded_by)
                VALUES (?, ?, ?, ?, ?)
            `, [paymentUuid, booking.id, totalPrice, payment_method, res.locals.user.id]);

            await db.run('COMMIT');
            res.redirect('/bookings');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[WALK_IN_ERROR]:', error);
            res.redirect(`/bookings?error=${encodeURIComponent(error.message)}`);
        }
    });

    // GET /requests - Online booking requests with search & pagination
    router.get('/requests', checkAuth, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'b.source = "online"';
        const params = [];

        if (search) {
            whereClause += ' AND (b.guest_name LIKE ? OR b.phone_number LIKE ? OR b.telegram LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const total = (await db.get(`SELECT COUNT(*) as count FROM bookings b WHERE ${whereClause}`, params)).count;
        const requests = await db.all(`
            SELECT b.*, r.room_number, rt.name as type_name, rt.base_price 
            FROM bookings b 
            LEFT JOIN rooms r ON b.room_id = r.id 
            LEFT JOIN room_types rt ON r.room_type_id = rt.id 
            WHERE ${whereClause} 
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        res.render('requests', { 
            page: 'requests', requests,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total },
            search,
            error: req.query.error || null
        });
    });

    // POST /requests/:id/approve - Transactional approval
    router.post('/requests/:id/approve', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');
            if (booking.status !== 'pending') throw new Error('Booking is not in pending state');

            const room = await db.get('SELECT status FROM rooms WHERE id = ?', [booking.room_id]);
            if (room.status !== 'available') {
                throw new Error('Room conflict detected during sync');
            }

            // Find or create guest
            let guest = await db.get('SELECT id FROM guests WHERE phone_number = ?', [booking.phone_number]);
            if (!guest) {
                const guestUuid = uuidv4();
                const guestResult = await db.run(
                    'INSERT INTO guests (uuid, full_name, phone_number, email, telegram) VALUES (?, ?, ?, ?, ?)',
                    [guestUuid, booking.guest_name, booking.phone_number, booking.guest_email, booking.telegram]
                );
                guest = { id: guestResult.lastID };
            }

            await db.run('UPDATE bookings SET status = "approved", guest_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [guest.id, req.params.id]);
            await db.run('UPDATE rooms SET status = "occupied", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [booking.room_id]);

            await audit.log(res.locals.user.id, 'UPDATE', 'bookings', booking.id, { status: 'pending' }, { status: 'approved' });

            await db.run('COMMIT');
            res.redirect('/requests');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[APPROVAL_ERROR]:', error);
            res.redirect(`/requests?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /requests/:id/reject - Transactional rejection with room release
    router.post('/requests/:id/reject', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');

            await db.run('UPDATE bookings SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
            
            // Release room if it was held
            const room = await db.get('SELECT status FROM rooms WHERE id = ?', [booking.room_id]);
            if (room && room.status === 'occupied') {
                // Check if any other active booking holds this room
                const otherBooking = await db.get(
                    'SELECT id FROM bookings WHERE room_id = ? AND id != ? AND status IN ("approved", "checked_in")',
                    [booking.room_id, booking.id]
                );
                if (!otherBooking) {
                    await db.run('UPDATE rooms SET status = "available", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [booking.room_id]);
                }
            }

            await audit.log(res.locals.user.id, 'UPDATE', 'bookings', req.params.id, { status: booking.status }, { status: 'rejected' });

            await db.run('COMMIT');
            res.redirect('/requests');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[REJECT_ERROR]:', error);
            res.redirect(`/requests?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /bookings/:id/check-in
    router.post('/bookings/:id/check-in', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');
            if (booking.status !== 'approved') throw new Error('Only approved bookings can be checked in');

            await db.run('UPDATE bookings SET status = "checked_in", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
            await db.run('UPDATE rooms SET status = "occupied", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [booking.room_id]);

            await audit.log(res.locals.user.id, 'UPDATE', 'bookings', booking.id, { status: 'approved' }, { status: 'checked_in' });

            await db.run('COMMIT');
            res.redirect(req.get('Referrer') || '/bookings');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[CHECK_IN_ERROR]:', error);
            res.redirect(`/bookings?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /bookings/:id/check-out - Releases room
    router.post('/bookings/:id/check-out', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');
            if (booking.status !== 'checked_in') throw new Error('Only checked-in bookings can be checked out');

            await db.run('UPDATE bookings SET status = "checked_out", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
            await db.run('UPDATE rooms SET status = "dirty", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [booking.room_id]);

            await audit.log(res.locals.user.id, 'UPDATE', 'bookings', booking.id, { status: 'checked_in' }, { status: 'checked_out' });

            await db.run('COMMIT');
            res.redirect(req.get('Referrer') || '/bookings');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[CHECK_OUT_ERROR]:', error);
            res.redirect(`/bookings?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /bookings/:id/cancel - Cancellation with room release
    router.post('/bookings/:id/cancel', checkAuth, async (req, res) => {
        try {
            await db.run('BEGIN TRANSACTION');

            const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
            if (!booking) throw new Error('Booking not found');
            if (['checked_out', 'cancelled'].includes(booking.status)) throw new Error('Cannot cancel this booking');

            const oldStatus = booking.status;
            await db.run('UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
            
            // Release room if booking was holding it
            if (['approved', 'checked_in'].includes(oldStatus)) {
                const otherBooking = await db.get(
                    'SELECT id FROM bookings WHERE room_id = ? AND id != ? AND status IN ("approved", "checked_in")',
                    [booking.room_id, booking.id]
                );
                if (!otherBooking) {
                    await db.run('UPDATE rooms SET status = "available", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [booking.room_id]);
                }
            }

            await audit.log(res.locals.user.id, 'UPDATE', 'bookings', booking.id, { status: oldStatus }, { status: 'cancelled' });

            await db.run('COMMIT');
            res.redirect(req.get('Referrer') || '/bookings');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('[CANCEL_ERROR]:', error);
            res.redirect(`/bookings?error=${encodeURIComponent(error.message)}`);
        }
    });

    // GET /bookings/:id/invoice - PDF Invoice
    router.get('/bookings/:id/invoice', checkAuth, async (req, res) => {
        const b = await db.get('SELECT b.*, r.room_number, rt.name as type_name FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_types rt ON r.room_type_id = rt.id WHERE b.id = ?', [req.params.id]);
        
        if (!b) return res.status(404).send('Not Found');
        
        // Security: Don't allow invoices for rejected or pending bookings
        if (['rejected', 'pending', 'cancelled'].includes(b.status)) {
            return res.status(403).send('Invoice unavailable for current booking status');
        }

        const charges = await db.all('SELECT * FROM room_charges WHERE booking_id = ? ORDER BY created_at', [b.id]);
        const payments = await db.all('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at', [b.id]);

        const nights = Math.max(Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000 * 60 * 60 * 24)), 1);

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${b.uuid}.pdf`);
        doc.pipe(res);
        
        // Header
        doc.fontSize(28).font('Helvetica-Bold').text('ELYSIAN HOTEL', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('LUXURY RESIDENCE & DINING', { align: 'center' });
        doc.moveDown(2);
        
        // Reference
        doc.fontSize(10).font('Helvetica').text(`Invoice Ref: ${b.uuid}`, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);
        
        // Guest Info
        doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:');
        doc.fontSize(11).font('Helvetica').text(b.guest_name);
        if (b.phone_number) doc.text(`Phone: ${b.phone_number}`);
        doc.moveDown(2);
        
        // Stay Details
        doc.fontSize(12).font('Helvetica-Bold').text('ACCOMMODATION:');
        doc.fontSize(11).font('Helvetica');
        doc.text(`Room: ${b.room_number} (${b.type_name})`);
        doc.text(`Period: ${b.check_in_date} to ${b.check_out_date} (${nights} night(s))`);
        doc.text(`Rate: $${(b.total_price / nights).toFixed(2)}/night`);
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text(`Accommodation Total: $${b.total_price.toFixed(2)}`, { align: 'right' });
        doc.moveDown(2);

        // Extra Charges
        if (charges.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('ADDITIONAL SERVICES:');
            charges.forEach(c => {
                doc.fontSize(11).font('Helvetica').text(`${new Date(c.created_at).toLocaleDateString()} - ${c.item_name}`, { continued: true });
                doc.text(`: $${c.amount.toFixed(2)}`, { align: 'right' });
            });
            const chargeTotal = charges.reduce((s, c) => s + c.amount, 0);
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica-Bold').text(`Services Total: $${chargeTotal.toFixed(2)}`, { align: 'right' });
            doc.moveDown(2);
        }
        
        // Summary
        const grandTotal = b.total_price + charges.reduce((s, c) => s + c.amount, 0);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        const balanceDue = grandTotal - totalPaid;

        doc.rect(50, doc.y, 500, 2).fill('#18181b');
        doc.moveDown(1);
        
        doc.fontSize(14).font('Helvetica-Bold').text(`GRAND TOTAL: $${grandTotal.toFixed(2)}`, { align: 'right' });
        doc.fontSize(11).font('Helvetica').text(`Total Paid: $${totalPaid.toFixed(2)}`, { align: 'right' });
        doc.fontSize(14).font('Helvetica-Bold').fillColor(balanceDue > 0 ? '#dc3545' : '#198754').text(`BALANCE DUE: $${balanceDue.toFixed(2)}`, { align: 'right' });
        
        doc.end();
    });

    return router;
};
