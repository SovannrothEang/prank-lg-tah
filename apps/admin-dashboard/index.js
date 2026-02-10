const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const { initDb } = require('./db/init-db');

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
    
    const { auth, adminOnly } = require('./middleware/auth');
    const checkAuth = auth(db);

    // Auth Routes
    app.get('/login', (req, res) => res.render('login', { error: req.query.error === 'session_invalidated' ? 'Logged in from another location.' : null }));
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (user && await bcrypt.compare(password, user.password)) {
            await db.run('UPDATE users SET session_id = ? WHERE id = ?', [req.sessionID, user.id]);
            req.session.user = { id: user.id, username: user.username, role: user.role, name: user.full_name };
            return res.redirect('/');
        }
        res.render('login', { error: 'Access Denied' });
    });
    app.get('/logout', async (req, res) => {
        if (req.session.user) await db.run('UPDATE users SET session_id = NULL WHERE id = ?', [req.session.user.id]);
        req.session.destroy();
        res.redirect('/login');
    });

    // Global User Object for Views
    app.use((req, res, next) => { res.locals.user = req.session.user; next(); });

    // Dashboard Overview
    app.get('/', checkAuth, async (req, res) => {
        const totalRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1')).count;
        const occupiedRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "occupied"')).count;
        const pendingRequests = (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"')).count;
        const revenueData = await db.get('SELECT SUM(total_price) as sum FROM bookings WHERE status = "approved"');
        
        const stats = {
            totalRooms,
            occupiedRooms,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            pendingRequests,
            revenue: revenueData.sum || 0,
            recentBookings: await db.all('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5')
        };
        res.render('index', { page: 'overview', stats });
    });

    // Sub-routes
    app.use('/', require('./routes/bookings')(db));
    app.use('/', require('./routes/inventory')(db));
    app.use('/', require('./routes/restaurant')(db));
    app.use('/', require('./routes/reports')(db));
    app.use('/', require('./routes/staff')(db));
    app.use('/', require('./routes/api')(db));

    console.log(`Enterprise System Modularized on port ${PORT}`);
})();

app.listen(PORT);
