require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { rateLimit } = require('express-rate-limit');
const { initDb } = require('./db/init-db');
const { errorHandler } = require('./middleware/response');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Use a long stable secret for JWT
const JWT_SECRET = process.env.SESSION_SECRET || 'elysian-luxury-hotel-management-system-secret-key-2026';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Middleware
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cors());
app.use(cookieParser(JWT_SECRET));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }
});

app.use('/api/', apiLimiter);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

(async () => { 
    const db = await initDb();
    
    // Auth Middleware and Helpers
    const generateAccessToken = (user) => {
        return jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.full_name },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
    };

    const generateRefreshToken = async (userId) => {
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
        
        await db.run('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)', 
            [token, userId, expiresAt.toISOString()]);
        
        return token;
    };

    const { auth } = require('./middleware/auth');
    const checkAuth = auth(db, JWT_SECRET, generateAccessToken);

    // Register Audit Service
    const AuditService = require('./services/AuditService');
    const audit = new AuditService(db);

    // Socket.io connection handling
    io.on('connection', (socket) => {
        console.log('[SOCKET] Admin connected:', socket.id);
        socket.on('disconnect', () => console.log('[SOCKET] Admin disconnected'));
    });

    // Auth Routes
    app.get('/login', (req, res) => {
        if (req.cookies.access_token) return res.redirect('/');
        res.render('login', { error: null });
    });
    
    app.post('/login', loginLimiter, async (req, res) => {
        const { username, password } = req.body;
        const bcrypt = require('bcryptjs');
        const user = await db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
        
        if (user && await bcrypt.compare(password, user.password)) {
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user.id);
            
            await audit.log(user.id, 'LOGIN', 'users', user.id, null, { action: 'successful_login' });
            
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 3600000 // 1h
            });

            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/refresh',
                maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
            });

            return res.redirect('/');
        }
        await audit.log(null, 'LOGIN_FAILED', 'users', null, null, { username });
        res.render('login', { error: 'Access Denied' });
    });

    app.get('/logout', async (req, res) => {
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
            await db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        }
        try {
            const decoded = jwt.decode(req.cookies.access_token);
            if (decoded) await audit.log(decoded.id, 'LOGOUT', 'users', decoded.id);
        } catch (e) {}

        res.clearCookie('access_token');
        res.clearCookie('refresh_token', { path: '/refresh' });
        res.redirect('/login');
    });

    // Dashboard
    app.get('/', checkAuth, async (req, res) => {
        const totalRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1')).count;
        const occupiedRooms = (await db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "occupied"')).count;
        const pendingRequests = (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"')).count;
        const revenueData = await db.get('SELECT SUM(total_price) as sum FROM bookings WHERE status IN ("approved", "checked_in", "checked_out")');
        
        const revenueTrend = await db.all(`
            SELECT strftime('%m-%d', created_at) as day, SUM(total_price) as daily_total 
            FROM bookings 
            WHERE status IN ('approved', 'checked_in', 'checked_out') AND created_at >= date('now', '-7 days')
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
    app.use('/', require('./routes/payments')(db));
    app.use('/', require('./routes/reports')(db));
    app.use('/', require('./routes/staff')(db));
    app.use('/', require('./routes/housekeeping')(db));
        app.use('/', require('./routes/audit')(db));
    app.use('/', require('./routes/guests')(db));
    app.use('/', require('./routes/pos')(db));
    app.use('/', require('./routes/api')(db, io));
 // Passing IO to API routes

    // Global Error Handler
    app.use(errorHandler);

    server.listen(PORT, () => {
        console.log(`[SERVER] Hotel Admin Dashboard running on port ${PORT}`);
    });
})();
