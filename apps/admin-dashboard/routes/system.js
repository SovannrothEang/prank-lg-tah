const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const SeedingService = require('../services/SeedingService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const seeder = new SeedingService(db);

    // GET /system/seed - UI for seeding
    router.get('/system/seed', checkAuth, adminOnly, async (req, res) => {
        const counts = {
            guests: (await db.get('SELECT COUNT(*) as count FROM guests')).count,
            bookings: (await db.get('SELECT COUNT(*) as count FROM bookings')).count,
            rooms: (await db.get('SELECT COUNT(*) as count FROM rooms')).count,
            menu: (await db.get('SELECT COUNT(*) as count FROM menu_items')).count
        };
        res.render('seed', { page: 'seed', counts, error: req.query.error || null, success: req.query.success || null });
    });

    // POST /system/seed/run - Run the seeder
    router.post('/system/seed/run', checkAuth, adminOnly, async (req, res) => {
        try {
            await seeder.seedAll();
            res.redirect('/system/seed?success=Database+seeded+successfully');
        } catch (error) {
            res.redirect(`/system/seed?error=${encodeURIComponent(error.message)}`);
        }
    });

    // POST /system/seed/wipe - Clear data (DANGEROUS)
    router.post('/system/seed/wipe', checkAuth, adminOnly, async (req, res) => {
        try {
            await db.run('DELETE FROM refresh_tokens');
            await db.run('DELETE FROM payments');
            await db.run('DELETE FROM room_charges');
            await db.run('DELETE FROM bookings');
            await db.run('DELETE FROM guests');
            // We keep room_types and users to avoid total lockout
            res.redirect('/system/seed?success=Operational+data+wiped');
        } catch (error) {
            res.redirect(`/system/seed?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
