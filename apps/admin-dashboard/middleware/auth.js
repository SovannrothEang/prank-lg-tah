const jwt = require('jsonwebtoken');

// Use same secret as index.js
const JWT_SECRET = process.env.SESSION_SECRET || 'elysian-luxury-hotel-management-system-secret-key-2026';

const auth = (db) => async (req, res, next) => {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (!accessToken) {
        if (!refreshToken) {
            return res.redirect('/login');
        }
        return handleRefresh(req, res, next, db, refreshToken);
    }

    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        
        // Verify user is still active in DB
        const user = await db.get('SELECT is_active FROM users WHERE id = ?', [decoded.id]);
        if (!user || !user.is_active) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token', { path: '/refresh' });
            return res.redirect('/login?error=account_disabled');
        }

        res.locals.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError' && refreshToken) {
            return handleRefresh(req, res, next, db, refreshToken);
        }
        res.clearCookie('access_token');
        return res.redirect('/login');
    }
};

async function handleRefresh(req, res, next, db, refreshToken) {
    try {
        const storedToken = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
        if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
            if (storedToken) await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
            res.clearCookie('access_token');
            res.clearCookie('refresh_token', { path: '/refresh' });
            return res.redirect('/login');
        }

        const user = await db.get('SELECT * FROM users WHERE id = ? AND is_active = 1', [storedToken.user_id]);
        if (!user) {
            await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
            res.clearCookie('access_token');
            res.clearCookie('refresh_token', { path: '/refresh' });
            return res.redirect('/login');
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.full_name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1h
        });

        res.locals.user = { id: user.id, username: user.username, role: user.role, name: user.full_name };
        next();
    } catch (error) {
        console.error('[AUTH_REFRESH_ERROR]:', error);
        res.redirect('/login');
    }
}

const adminOnly = (req, res, next) => {
    if (res.locals.user && res.locals.user.role === 'admin') return next();
    res.status(403).render('error', { message: 'Access Denied: Administrators only', status: 403 });
};

const managerOnly = (req, res, next) => {
    if (res.locals.user && (res.locals.user.role === 'admin' || res.locals.user.role === 'manager')) return next();
    res.status(403).render('error', { message: 'Access Denied: Management authorization required', status: 403 });
};

module.exports = { auth, adminOnly, managerOnly };
