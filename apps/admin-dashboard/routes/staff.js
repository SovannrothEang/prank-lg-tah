const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { auth, adminOnly } = require('../middleware/auth');
const { validate, staffSchema } = require('../middleware/validate');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    router.get('/staff', checkAuth, adminOnly, async (req, res) => {
        const staff = await db.all('SELECT id, uuid, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
        res.render('staff', { page: 'staff', staff, error: req.query.error || null });
    });

    router.post('/staff', checkAuth, adminOnly, validate(staffSchema), async (req, res) => {
        const { username, password, full_name, role } = req.validatedBody;
        try {
            // Check for duplicate username
            const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
            if (existing) throw new Error('Username already exists');

            const hashedPassword = await bcrypt.hash(password, 12);
            const uuid = uuidv4();
            await db.run('INSERT INTO users (uuid, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)', 
                [uuid, username, hashedPassword, full_name, role]);
            
            await audit.log(res.locals.user.id, 'CREATE', 'users', null, null, { username, role });
            res.redirect('/staff');
        } catch (error) {
            console.error('[STAFF_CREATE_ERROR]:', error);
            res.redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Deactivate staff member
    router.post('/staff/:id/deactivate', checkAuth, adminOnly, async (req, res) => {
        try {
            const staffId = parseInt(req.params.id);
            if (staffId === res.locals.user.id) throw new Error('Cannot deactivate your own account');

            const member = await db.get('SELECT * FROM users WHERE id = ?', [staffId]);
            if (!member) throw new Error('Staff member not found');

            const newStatus = member.is_active ? 0 : 1;
            await db.run('UPDATE users SET is_active = ?, session_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, staffId]);
            
            await audit.log(res.locals.user.id, 'UPDATE', 'users', staffId, 
                { is_active: member.is_active }, { is_active: newStatus });
            
            res.redirect('/staff');
        } catch (error) {
            console.error('[STAFF_DEACTIVATE_ERROR]:', error);
            res.redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Reset staff password
    router.post('/staff/:id/reset-password', checkAuth, adminOnly, async (req, res) => {
        try {
            const staffId = parseInt(req.params.id);
            const { new_password } = req.body;

            if (!new_password || new_password.length < 6) throw new Error('Password must be at least 6 characters');

            const member = await db.get('SELECT * FROM users WHERE id = ?', [staffId]);
            if (!member) throw new Error('Staff member not found');

            const hashedPassword = await bcrypt.hash(new_password, 12);
            await db.run('UPDATE users SET password = ?, session_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, staffId]);
            
            await audit.log(res.locals.user.id, 'UPDATE', 'users', staffId, null, { action: 'password_reset' });
            
            res.redirect('/staff');
        } catch (error) {
            res.redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
