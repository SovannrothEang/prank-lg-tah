const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    // GET /housekeeping - View all rooms needing attention
    router.get('/housekeeping', checkAuth, async (req, res) => {
        const rooms = await db.all(`
            SELECT r.*, rt.name as type_name 
            FROM rooms r 
            JOIN room_types rt ON r.room_type_id = rt.id 
            WHERE r.status IN ('dirty', 'maintenance', 'available')
            AND r.is_active = 1 AND r.deleted_at IS NULL
            ORDER BY 
                CASE r.status 
                    WHEN 'dirty' THEN 1 
                    WHEN 'maintenance' THEN 2 
                    ELSE 3 
                END, r.room_number ASC
        `);

        const stats = {
            dirty: rooms.filter(r => r.status === 'dirty').length,
            maintenance: rooms.filter(r => r.status === 'maintenance').length,
            available: rooms.filter(r => r.status === 'available').length
        };

        res.render('housekeeping', { page: 'housekeeping', rooms, stats, error: req.query.error || null });
    });

    // POST /housekeeping/:id/clean - Mark room as available
    router.post('/housekeeping/:id/clean', checkAuth, async (req, res) => {
        try {
            const room = await db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
            if (!room) throw new Error('Room not found');
            
            await db.run('UPDATE rooms SET status = "available", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
            await audit.log(res.locals.user.id, 'UPDATE', 'rooms', req.params.id, { status: room.status }, { status: 'available' });
            
            res.redirect('/housekeeping');
        } catch (error) {
            res.redirect(`/housekeeping?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /housekeeping/:id/maintenance - Toggle maintenance status
    router.post('/housekeeping/:id/maintenance', checkAuth, async (req, res) => {
        try {
            const room = await db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
            if (!room) throw new Error('Room not found');
            if (room.status === 'occupied') throw new Error('Cannot put an occupied room into maintenance');

            const newStatus = room.status === 'maintenance' ? 'dirty' : 'maintenance';
            await db.run('UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, req.params.id]);
            await audit.log(res.locals.user.id, 'UPDATE', 'rooms', req.params.id, { status: room.status }, { status: newStatus });
            
            res.redirect('/housekeeping');
        } catch (error) {
            res.redirect(`/housekeeping?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
