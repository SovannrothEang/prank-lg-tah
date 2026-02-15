const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth, managerOnly } = require('../middleware/auth');
const { validate, roomTypeSchema, roomSchema } = require('../middleware/validate');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    // Room Types
    router.get('/room-types', checkAuth, async (req, res) => {
        const types = await db.all('SELECT * FROM room_types WHERE deleted_at IS NULL ORDER BY name');
        res.render('room-types', { page: 'room-types', types, error: req.query.error || null });
    });

    router.post('/room-types', checkAuth, managerOnly, validate(roomTypeSchema), async (req, res) => {
        const { id, name, description, base_price, is_active } = req.validatedBody;
        try {
            if (id) {
                const old = await db.get('SELECT * FROM room_types WHERE id = ?', [id]);
                await db.run('UPDATE room_types SET name = ?, description = ?, base_price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                    [name, description, base_price, is_active ? 1 : 0, id]);
                await audit.log(res.locals.user.id, 'UPDATE', 'room_types', id, { name: old.name, base_price: old.base_price }, { name, base_price });
            } else {
                const uuid = uuidv4();
                await db.run('INSERT INTO room_types (uuid, name, description, base_price) VALUES (?, ?, ?, ?)', 
                    [uuid, name, description, base_price]);
                await audit.log(res.locals.user.id, 'CREATE', 'room_types', null, null, { name, base_price });
            }
            res.redirect('/room-types');
        } catch (error) {
            console.error('[ROOM_TYPE_ERROR]:', error);
            res.redirect(`/room-types?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Soft-delete room type
    router.post('/room-types/:id/delete', checkAuth, managerOnly, async (req, res) => {
        try {
            const type = await db.get('SELECT * FROM room_types WHERE id = ?', [req.params.id]);
            if (!type) throw new Error('Room type not found');

            // Check if any active rooms use this type
            const activeRooms = await db.get('SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ? AND deleted_at IS NULL', [req.params.id]);
            if (activeRooms.count > 0) {
                throw new Error(`Cannot delete: ${activeRooms.count} room(s) still use this type`);
            }

            await db.run('UPDATE room_types SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?', [req.params.id]);
            await audit.log(res.locals.user.id, 'DELETE', 'room_types', req.params.id, { name: type.name }, null);
            res.redirect('/room-types');
        } catch (error) {
            res.redirect(`/room-types?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Rooms
    router.get('/rooms', checkAuth, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 30;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        let whereClause = 'r.deleted_at IS NULL';
        const params = [];

        if (search) {
            whereClause += ' AND (r.room_number LIKE ? OR rt.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (statusFilter) {
            whereClause += ' AND r.status = ?';
            params.push(statusFilter);
        }

        const total = (await db.get(`SELECT COUNT(*) as count FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE ${whereClause}`, params)).count;
        const rooms = await db.all(`
            SELECT r.*, rt.name as type_name 
            FROM rooms r 
            JOIN room_types rt ON r.room_type_id = rt.id 
            WHERE ${whereClause}
            ORDER BY r.room_number
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        const types = await db.all('SELECT * FROM room_types WHERE is_active = 1 AND deleted_at IS NULL');
        
        res.render('rooms', { 
            page: 'rooms', rooms, types,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total },
            search, statusFilter,
            error: req.query.error || null
        });
    });

    router.post('/rooms', checkAuth, managerOnly, validate(roomSchema), async (req, res) => {
        const { id, room_number, room_type_id, status, is_active } = req.validatedBody;
        try {
            if (id) {
                const old = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
                await db.run('UPDATE rooms SET room_number = ?, room_type_id = ?, status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                    [room_number, room_type_id, status, is_active ? 1 : 0, id]);
                await audit.log(res.locals.user.id, 'UPDATE', 'rooms', id, { room_number: old.room_number, status: old.status }, { room_number, status });
            } else {
                // Check for duplicate room number
                const existing = await db.get('SELECT id FROM rooms WHERE room_number = ? AND deleted_at IS NULL', [room_number]);
                if (existing) throw new Error(`Room ${room_number} already exists`);

                const uuid = uuidv4();
                await db.run('INSERT INTO rooms (uuid, room_number, room_type_id) VALUES (?, ?, ?)', 
                    [uuid, room_number, room_type_id]);
                await audit.log(res.locals.user.id, 'CREATE', 'rooms', null, null, { room_number, room_type_id });
            }
            res.redirect('/rooms');
        } catch (error) {
            console.error('[ROOM_ERROR]:', error);
            res.redirect(`/rooms?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Soft-delete room
    router.post('/rooms/:id/delete', checkAuth, managerOnly, async (req, res) => {
        try {
            const room = await db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
            if (!room) throw new Error('Room not found');
            if (room.status === 'occupied') throw new Error('Cannot delete an occupied room');

            // Check for active bookings
            const activeBookings = await db.get(
                'SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status IN ("pending", "approved", "checked_in")',
                [req.params.id]
            );
            if (activeBookings.count > 0) throw new Error(`Cannot delete: ${activeBookings.count} active booking(s) on this room`);

            await db.run('UPDATE rooms SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?', [req.params.id]);
            await audit.log(res.locals.user.id, 'DELETE', 'rooms', req.params.id, { room_number: room.room_number }, null);
            res.redirect('/rooms');
        } catch (error) {
            res.redirect(`/rooms?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
