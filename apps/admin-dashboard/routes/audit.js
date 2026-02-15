const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    // GET /audit - View system activity logs (Admin Only)
    router.get('/audit', checkAuth, adminOnly, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 50;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (a.action LIKE ? OR a.table_name LIKE ? OR u.full_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const total = (await db.get(`
            SELECT COUNT(*) as count 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            WHERE ${whereClause}
        `, params)).count;

        const logs = await db.all(`
            SELECT a.*, u.full_name as user_name, u.role as user_role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.render('audit', { 
            page: 'audit', 
            logs, 
            search,
            pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total }
        });
    });

    return router;
};
