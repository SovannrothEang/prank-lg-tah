const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, adminOnly } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    router.get('/staff', checkAuth, adminOnly, async (req, res) => {
        const staff = await db.all('SELECT id, username, full_name, role, created_at FROM users');
        res.render('staff', { page: 'staff', staff });
    });

    router.post('/staff', checkAuth, adminOnly, async (req, res) => {
        const { username, password, full_name, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', 
            [username, hashedPassword, full_name, role]);
        res.redirect('/staff');
    });

    return router;
};
