const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../middleware/response');

module.exports = (db) => {
    // GET /api/rooms/available
    // Enterprise Standard: Filtered by multiple conditions, returns lean data
    router.get('/api/rooms/available', async (req, res) => {
        try {
            const rooms = await db.all(`
                SELECT r.uuid, r.room_number, rt.name as type_name, rt.base_price, rt.description
                FROM rooms r 
                JOIN room_types rt ON r.room_type_id = rt.id 
                WHERE r.status = 'available' 
                AND r.is_active = 1 
                AND rt.is_active = 1
                AND r.deleted_at IS NULL
            `);
            return successResponse(res, rooms);
        } catch (error) {
            return errorResponse(res, 'Could not fetch available residences');
        }
    });

    // POST /api/bookings
    // Enterprise Standard: Request ID tracking, UUID generation, duplicate prevention
    router.post('/api/bookings', async (req, res) => {
        const { guest_name, phone_number, telegram, room_uuid, check_in_date, check_out_date, special_requests } = req.body;

        try {
            // 1. Resolve internal ID from UUID (Preventing ID enumeration)
            const room = await db.get('SELECT id, status FROM rooms WHERE uuid = ?', [room_uuid]);
            if (!room) return errorResponse(res, 'Invalid residence selection', 'INVALID_ROOM', 400);
            if (room.status !== 'available') return errorResponse(res, 'Residence is no longer available', 'ROOM_TAKEN', 409);

            // 2. Duplicate Protection (Active Pending Requests)
            const existing = await db.get(`
                SELECT id FROM bookings 
                WHERE (phone_number = ? OR telegram = ?) 
                AND status = 'pending'
            `, [phone_number, telegram]);

            if (existing) {
                return errorResponse(res, 'A pending request already exists for this contact.', 'DUPLICATE_REQUEST', 429);
            }

            // 3. Resolve Pricing (Backend-only truth)
            const roomType = await db.get(`
                SELECT rt.base_price 
                FROM rooms r 
                JOIN room_types rt ON r.room_type_id = rt.id 
                WHERE r.id = ?
            `, [room.id]);

            const start = new Date(check_in_date);
            const end = new Date(check_out_date);
            const nights = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
            const totalPrice = nights * roomType.base_price;

            // 4. Persistence with UUID
            const bookingUuid = uuidv4();
            await db.run(`
                INSERT INTO bookings (uuid, guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price, special_requests)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'online', ?, ?)
            `, [bookingUuid, guest_name, phone_number, telegram, room.id, check_in_date, check_out_date, totalPrice, special_requests]);

            return successResponse(res, { bookingReference: bookingUuid, total: totalPrice }, null, 201);

        } catch (error) {
            console.error('[BOOKING_POST_ERROR]:', error);
            return errorResponse(res, 'Booking engine failure. Please contact support.', 'SERVICE_FAILURE');
        }
    });

    return router;
};