const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, managerOnly } = require('../middleware/auth');
const { validate, roomTypeSchema, roomSchema } = require('../middleware/validate');
const AuditService = require('../services/AuditService');

// Ensure rooms directory exists
const roomsDir = path.join(__dirname, '../public/rooms');
if (!fs.existsSync(roomsDir)) {
    fs.mkdirSync(roomsDir, { recursive: true });
}

// Multer config for room images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, roomsDir);
    },
    filename: (req, file, cb) => {
        // We'll rename it later with the room ID, for now use a temp name or timestamp
        cb(null, `room_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
        return cb(new Error('Only image uploads are allowed'));
    }
});

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

    router.post('/rooms', checkAuth, managerOnly, upload.single('room_image'), validate(roomSchema), async (req, res) => {
        const { id, room_number, room_type_id, status, is_active } = req.validatedBody;
        try {
            let imagePath = null;
            if (req.file) {
                imagePath = `/rooms/${req.file.filename}`;
            }

            if (id) {
                const old = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
                
                let finalImagePath = imagePath;
                if (req.file) {
                    const ext = path.extname(req.file.originalname);
                    const newFileName = `${id}${ext}`;
                    const newPath = path.join(roomsDir, newFileName);
                    
                    // Rename temp file to ID-based name
                    if (fs.existsSync(req.file.path)) {
                        fs.renameSync(req.file.path, newPath);
                        finalImagePath = `/rooms/${newFileName}`;
                    }
                }

                let updateQuery = 'UPDATE rooms SET room_number = ?, room_type_id = ?, status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP';
                let params = [room_number, room_type_id, status, is_active ? 1 : 0];
                
                if (finalImagePath) {
                    updateQuery += ', image_path = ?';
                    params.push(finalImagePath);

                    // Delete old image if it exists and it's different
                    if (old.image_path && old.image_path !== finalImagePath) {
                        const oldFileName = path.basename(old.image_path);
                        const oldPath = path.join(roomsDir, oldFileName);
                        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    }
                }
                
                updateQuery += ' WHERE id = ?';
                params.push(id);
                
                await db.run(updateQuery, params);
                await audit.log(res.locals.user.id, 'UPDATE', 'rooms', id, { room_number: old.room_number, status: old.status }, { room_number, status });
            } else {
                // Check for duplicate room number
                const existing = await db.get('SELECT id FROM rooms WHERE room_number = ? AND deleted_at IS NULL', [room_number]);
                if (existing) {
                    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                    throw new Error(`Room ${room_number} already exists`);
                }

                const uuid = uuidv4();
                const result = await db.run('INSERT INTO rooms (uuid, room_number, room_type_id, status, is_active) VALUES (?, ?, ?, ?, ?)', 
                    [uuid, room_number, room_type_id, status, is_active ? 1 : 0]);
                
                const newId = result.lastID;
                let finalImagePath = null;

                if (req.file) {
                    const ext = path.extname(req.file.originalname);
                    const newFileName = `${newId}${ext}`;
                    const newPath = path.join(roomsDir, newFileName);
                    
                    if (fs.existsSync(req.file.path)) {
                        fs.renameSync(req.file.path, newPath);
                        finalImagePath = `/rooms/${newFileName}`;
                        await db.run('UPDATE rooms SET image_path = ? WHERE id = ?', [finalImagePath, newId]);
                    }
                }

                await audit.log(res.locals.user.id, 'CREATE', 'rooms', newId, null, { room_number, room_type_id });
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
