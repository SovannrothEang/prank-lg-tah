const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth, managerOnly } = require('../middleware/auth');
const { validate, menuItemSchema } = require('../middleware/validate');
const AuditService = require('../services/AuditService');

module.exports = (db) => {
    const checkAuth = auth(db);
    const audit = new AuditService(db);

    router.get('/restaurant-admin', checkAuth, async (req, res) => {
        const menu = await db.all('SELECT * FROM menu_items ORDER BY category, name');
        res.render('restaurant-admin', { page: 'restaurant', menu, error: req.query.error || null });
    });

    router.post('/restaurant-admin', checkAuth, managerOnly, validate(menuItemSchema), async (req, res) => {
        const { id, category, name, description, price, is_available } = req.validatedBody;
        try {
            if (id) {
                const old = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
                await db.run('UPDATE menu_items SET category = ?, name = ?, description = ?, price = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                    [category, name, description, price, is_available ? 1 : 0, id]);
                await audit.log(res.locals.user.id, 'UPDATE', 'menu_items', id, { name: old.name, price: old.price }, { name, price });
            } else {
                const uuid = uuidv4();
                await db.run('INSERT INTO menu_items (uuid, category, name, description, price) VALUES (?, ?, ?, ?, ?)', 
                    [uuid, category, name, description, price]);
                await audit.log(res.locals.user.id, 'CREATE', 'menu_items', null, null, { name, category, price });
            }
            res.redirect('/restaurant-admin');
        } catch (error) {
            console.error('[MENU_ERROR]:', error);
            res.redirect(`/restaurant-admin?error=${encodeURIComponent(error.message)}`);
        }
    });

    // Delete menu item
    router.post('/restaurant-admin/:id/delete', checkAuth, managerOnly, async (req, res) => {
        try {
            const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
            if (!item) throw new Error('Menu item not found');
            
            await db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
            await audit.log(res.locals.user.id, 'DELETE', 'menu_items', req.params.id, { name: item.name }, null);
            res.redirect('/restaurant-admin');
        } catch (error) {
            res.redirect(`/restaurant-admin?error=${encodeURIComponent(error.message)}`);
        }
    });

    return router;
};
