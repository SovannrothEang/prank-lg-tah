const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    // GET /guests - List all guests
    router.get('/guests', checkAuth, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (full_name LIKE ? OR phone_number LIKE ? OR email LIKE ? OR telegram LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const total = (await db.get(`SELECT COUNT(*) as count FROM guests WHERE ${whereClause}`, params)).count;
        const guests = await db.all(`
            SELECT g.*, 
                   (SELECT COUNT(*) FROM bookings WHERE guest_id = g.id) as stay_count,
                   (SELECT SUM(total_price) FROM bookings WHERE guest_id = g.id AND status IN ('approved', 'checked_in', 'checked_out')) as total_spend
            FROM guests g
            WHERE ${whereClause}
            ORDER BY g.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.render('guests', { 
            page: 'guests', 
            guests, 
            search,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total },
            error: req.query.error || null
        });
    });

    // POST /guests/:id/vip - Toggle VIP status
    router.post('/guests/:id/vip', checkAuth, async (req, res) => {
        try {
            const guest = await db.get('SELECT * FROM guests WHERE id = ?', [req.params.id]);
            if (!guest) throw new Error('Guest not found');
            
            const newStatus = guest.is_vip ? 0 : 1;
            await db.run('UPDATE guests SET is_vip = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, req.params.id]);
            await audit.log(res.locals.user.id, 'UPDATE', 'guests', req.params.id, { is_vip: guest.is_vip }, { is_vip: newStatus });
            
            res.redirect('/guests');
        } catch (error) {
            res.redirect(`/guests?error=${encodeURIComponent(error.message)}`);
        }
    });

    // GET /guests/:id - Guest details and stay history
    router.get('/guests/:id', checkAuth, async (req, res) => {
        const guest = await db.get('SELECT * FROM guests WHERE id = ?', [req.params.id]);
        if (!guest) return res.status(404).render('error', { message: 'Guest not found' });

        const bookings = await db.all(`
            SELECT b.*, r.room_number, rt.name as type_name
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE b.guest_id = ?
            ORDER BY b.check_in_date DESC
        `, [guest.id]);

        res.render('guest-detail', { page: 'guests', guest, bookings });
    });

    return router;
};
