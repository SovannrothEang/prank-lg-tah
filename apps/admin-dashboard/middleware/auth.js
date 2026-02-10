const auth = (db) => async (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');

    const user = await db.get('SELECT session_id FROM users WHERE id = ?', [req.session.user.id]);
    if (user.session_id !== req.sessionID) {
        req.session.destroy();
        return res.redirect('/login?error=session_invalidated');
    }
    res.locals.user = req.session.user;
    next();
};

const adminOnly = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).send('Access Denied: Administrators only');
};

module.exports = { auth, adminOnly };
