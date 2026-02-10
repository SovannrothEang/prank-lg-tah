const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { initDb } = require('./db/init-db');
const { errorHandler } = require('./middleware/response');

const app = express();
const PORT = 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
    secret: 'hotel-elysian-modular-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let db;
(async () => { 
    db = await initDb();
    
    const { auth } = require('./middleware/auth');
    const checkAuth = auth(db);

    // Register Audit Service
    const AuditService = require('./services/AuditService');
    const audit = new AuditService(db);

    // Auth Routes
    app.get('/login', (req, res) => res.render('login', { error: req.query.error === 'session_invalidated' ? 'Logged in from another location.' : null }));
    
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const bcrypt = require('bcryptjs');
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (user && await bcrypt.compare(password, user.password)) {
            await db.run('UPDATE users SET session_id = ? WHERE id = ?', [req.sessionID, user.id]);
            await audit.log(user.id, 'LOGIN', 'users', user.id, null, { action: 'successful_login' });
            
            req.session.user = { id: user.id, username: user.username, role: user.role, name: user.full_name };
            return res.redirect('/');
        }
        res.render('login', { error: 'Access Denied' });
    });

    app.get('/logout', async (req, res) => {
        if (req.session.user) {
            await audit.log(req.session.user.id, 'LOGOUT', 'users', req.session.user.id);
            await db.run('UPDATE users SET session_id = NULL WHERE id = ?', [req.session.user.id]);
        }
        req.session.destroy();
        res.redirect('/login');
    });

    // Dashboard
    app.get('/', checkAuth, async (req, res) => {
        const totalRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1')).count;
        const occupiedRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "occupied"')).count;
        const pendingRequests = (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"')).count;
        const revenueData = await db.get('SELECT SUM(total_price) as sum FROM bookings WHERE status = "approved"');
        
        const revenueTrend = await db.all(`
            SELECT strftime('%m-%d', created_at) as day, SUM(total_price) as daily_total 
            FROM bookings 
            WHERE status = 'approved' AND created_at >= date('now', '-7 days')
            GROUP BY day ORDER BY day ASC
        `);

        const statusDist = await db.all(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`);

        const stats = {
            totalRooms,
            occupiedRooms,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            pendingRequests,
            revenue: revenueData.sum || 0,
            revenueTrend: JSON.stringify(revenueTrend),
            statusDist: JSON.stringify(statusDist)
        };
        res.render('index', { page: 'overview', stats });
    });

    // Modular Routes
    app.use('/', require('./routes/bookings')(db));
    app.use('/', require('./routes/inventory')(db));
    app.use('/', require('./routes/restaurant')(db));
    app.use('/', require('./routes/reports')(db));
    app.use('/', require('./routes/staff')(db));
    app.use('/', require('./routes/api')(db));

    // Global Error Handler (Standard Enterprise)
    app.use(errorHandler);

    console.log(`🚀 Senior Enterprise Backend Active on port ${PORT}`);
})();

app.listen(PORT);