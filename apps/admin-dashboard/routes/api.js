const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../middleware/response');
const { validate, apiBookingSchema } = require('../middleware/validate');
const notificationService = require('../services/NotificationService');

module.exports = (db, io) => {
    router.get('/api/rooms/available', async (req, res) => {
        try {
            const { check_in, check_out } = req.query;

            let rooms;
            if (check_in && check_out) {
                rooms = await db.all(`
                    SELECT r.uuid, r.room_number, rt.name as type_name, rt.base_price, rt.description
                    FROM rooms r 
                    JOIN room_types rt ON r.room_type_id = rt.id 
                    WHERE r.is_active = 1 
                    AND rt.is_active = 1
                    AND r.deleted_at IS NULL
                    AND r.id NOT IN (
                        SELECT room_id FROM bookings 
                        WHERE status IN ('approved', 'checked_in', 'pending')
                        AND check_in_date < ?
                        AND check_out_date > ?
                    )
                `, [check_out, check_in]);
            } else {
                rooms = await db.all(`
                    SELECT r.uuid, r.room_number, rt.name as type_name, rt.base_price, rt.description
                    FROM rooms r 
                    JOIN room_types rt ON r.room_type_id = rt.id 
                    WHERE r.status = 'available' 
                    AND r.is_active = 1 
                    AND rt.is_active = 1
                    AND r.deleted_at IS NULL
                `);
            }
            return successResponse(res, rooms);
        } catch (error) {
            console.error('[API_ROOMS_ERROR]:', error);
            return errorResponse(res, 'Could not fetch available residences');
        }
    });

    router.post('/api/bookings', validate(apiBookingSchema), async (req, res) => {
        const { guest_name, phone_number, telegram, room_uuid, check_in_date, check_out_date, special_requests } = req.validatedBody;

        try {
            const room = await db.get('SELECT id, status FROM rooms WHERE uuid = ? AND is_active = 1 AND deleted_at IS NULL', [room_uuid]);
            if (!room) return errorResponse(res, 'Invalid selection', 'INVALID_ROOM', 400);
            if (room.status !== 'available') return errorResponse(res, 'Room already taken', 'ROOM_TAKEN', 409);

            const overlap = await db.get(`
                SELECT id FROM bookings 
                WHERE room_id = ? AND status IN ('approved', 'checked_in', 'pending')
                AND check_in_date < ? AND check_out_date > ?
            `, [room.id, check_out_date, check_in_date]);
            if (overlap) return errorResponse(res, 'Room not available for these dates', 'DATE_CONFLICT', 409);

            const existing = await db.get('SELECT id FROM bookings WHERE (phone_number = ? OR telegram = ?) AND status = "pending"', [phone_number, telegram]);
            if (existing) return errorResponse(res, 'Duplicate request detected.', 'DUPLICATE', 429);

            const roomData = await db.get('SELECT rt.name, rt.base_price FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?', [room.id]);
            
            const start = new Date(check_in_date);
            const end = new Date(check_out_date);
            const nights = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
            const totalPrice = nights * roomData.base_price;

            const bookingUuid = uuidv4();
            await db.run(`
                INSERT INTO bookings (uuid, guest_name, phone_number, telegram, room_id, check_in_date, check_out_date, status, source, total_price, special_requests)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'online', ?, ?)
            `, [bookingUuid, guest_name, phone_number, telegram, room.id, check_in_date, check_out_date, totalPrice, special_requests]);

            // Real-time alert to all connected admins
            if (io) {
                io.emit('new_booking', {
                    guest_name,
                    room_type: roomData.name,
                    total: totalPrice
                });
            }

            // Send staff alert (Telegram/Email)
            await notificationService.sendStaffAlert({
                guest_name, phone_number, telegram,
                type_name: roomData.name,
                check_in_date, check_out_date,
                total_price: totalPrice,
                special_requests
            });

            return successResponse(res, { bookingReference: bookingUuid, nights, total: totalPrice }, null, 201);

        } catch (error) {
            console.error('[API_BOOKING_ERROR]:', error);
            return errorResponse(res, 'System error during booking.');
        }
    });

    router.get('/api/bookings/:uuid/status', async (req, res) => {
        try {
            const booking = await db.get(
                'SELECT uuid, guest_name, status, check_in_date, check_out_date, total_price, created_at FROM bookings WHERE uuid = ?',
                [req.params.uuid]
            );
            if (!booking) return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
            return successResponse(res, booking);
        } catch (error) {
            return errorResponse(res, 'Could not fetch booking status');
        }
    });

    return router;
};
