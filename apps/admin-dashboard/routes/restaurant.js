const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    router.get('/restaurant-admin', checkAuth, async (req, res) => {
        const menu = await db.all('SELECT * FROM menu_items ORDER BY category, name');
        res.render('restaurant-admin', { page: 'restaurant', menu });
    });

    router.post('/restaurant-admin', checkAuth, async (req, res) => {
        const { id, category, name, description, price, is_available } = req.body;
        if (id) {
            await db.run('UPDATE menu_items SET category = ?, name = ?, description = ?, price = ?, is_available = ? WHERE id = ?', 
                [category, name, description, parseFloat(price), is_available ? 1 : 0, id]);
        } else {
            await db.run('INSERT INTO menu_items (category, name, description, price) VALUES (?, ?, ?, ?)', 
                [category, name, description, parseFloat(price)]);
        }
        res.redirect('/restaurant-admin');
    });

    return router;
};
