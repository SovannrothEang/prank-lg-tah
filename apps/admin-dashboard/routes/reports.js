const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { auth } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    router.get('/reports', checkAuth, async (req, res) => {
        const analytics = {
            revenueByType: await db.all('SELECT rt.name, SUM(b.total_price) as total FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_types rt ON r.room_type_id = rt.id WHERE b.status = "approved" GROUP BY rt.name'),
            sources: await db.all('SELECT source, COUNT(*) as count FROM bookings GROUP BY source'),
            monthlyTrend: await db.all('SELECT strftime("%Y-%m", created_at) as month, COUNT(*) as count, SUM(total_price) as revenue FROM bookings WHERE status = "approved" GROUP BY month ORDER BY month DESC LIMIT 6'),
            roomStatus: await db.all('SELECT status, COUNT(*) as count FROM rooms GROUP BY status')
        };
        res.render('reports', { page: 'reports', analytics });
    });

    router.get('/reports/excel', checkAuth, async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Bookings');
        sheet.columns = [
            { header: 'ID', key: 'id' }, { header: 'Guest', key: 'guest_name' }, { header: 'Phone', key: 'phone_number' },
            { header: 'Check-in', key: 'check_in_date' }, { header: 'Status', key: 'status' }, { header: 'Price', key: 'total_price' }
        ];
        sheet.addRows(await db.all('SELECT * FROM bookings'));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=elysian_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    });

    return router;
};
