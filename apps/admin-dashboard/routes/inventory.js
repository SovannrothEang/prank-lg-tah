const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    router.get('/room-types', checkAuth, async (req, res) => {
        const types = await db.all('SELECT * FROM room_types');
        res.render('room-types', { page: 'room-types', types });
    });

    router.post('/room-types', checkAuth, async (req, res) => {
        const { id, name, description, base_price, is_active } = req.body;
        if (id) {
            await db.run('UPDATE room_types SET name = ?, description = ?, base_price = ?, is_active = ? WHERE id = ?', 
                [name, description, parseFloat(base_price), is_active ? 1 : 0, id]);
        } else {
            await db.run('INSERT INTO room_types (name, description, base_price) VALUES (?, ?, ?)', 
                [name, description, parseFloat(base_price)]);
        }
        res.redirect('/room-types');
    });

    router.get('/rooms', checkAuth, async (req, res) => {
        const rooms = await db.all('SELECT r.*, rt.name as type_name FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id');
        const types = await db.all('SELECT * FROM room_types WHERE is_active = 1');
        res.render('rooms', { page: 'rooms', rooms, types });
    });

    router.post('/rooms', checkAuth, async (req, res) => {
        const { id, room_number, room_type_id, status, is_active } = req.body;
        if (id) {
            await db.run('UPDATE rooms SET room_number = ?, room_type_id = ?, status = ?, is_active = ? WHERE id = ?', 
                [room_number, room_type_id, status, is_active ? 1 : 0, id]);
        } else {
            await db.run('INSERT INTO rooms (room_number, room_type_id) VALUES (?, ?)', 
                [room_number, room_type_id]);
        }
        res.redirect('/rooms');
    });

    return router;
};
