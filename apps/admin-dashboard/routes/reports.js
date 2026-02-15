const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { auth } = require('../middleware/auth');

module.exports = (db) => {
    const checkAuth = auth(db);

    router.get('/reports', checkAuth, async (req, res) => {
        const analytics = {
            revenueByType: await db.all(`
                SELECT rt.name, SUM(b.total_price) as total 
                FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_types rt ON r.room_type_id = rt.id 
                WHERE b.status IN ('approved', 'checked_in', 'checked_out') 
                GROUP BY rt.name
            `),
            sources: await db.all('SELECT source, COUNT(*) as count FROM bookings GROUP BY source'),
            paymentMethods: await db.all('SELECT payment_method, SUM(amount) as total FROM payments GROUP BY payment_method'),
            monthlyTrend: await db.all(`
                SELECT strftime("%Y-%m", created_at) as month, COUNT(*) as count, SUM(total_price) as revenue 
                FROM bookings 
                WHERE status IN ('approved', 'checked_in', 'checked_out') 
                GROUP BY month ORDER BY month DESC LIMIT 6
            `),
            roomStatus: await db.all('SELECT status, COUNT(*) as count FROM rooms WHERE deleted_at IS NULL GROUP BY status'),
            // Occupancy over time (last 30 days)
            dailyOccupancy: await db.all(`
                SELECT strftime('%m-%d', created_at) as day, 
                       COUNT(CASE WHEN status IN ('approved', 'checked_in') THEN 1 END) as occupied
                FROM bookings 
                WHERE created_at >= date('now', '-30 days')
                GROUP BY day ORDER BY day ASC
            `),
            totalRooms: (await db.get('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1 AND deleted_at IS NULL')).count
        };

        // Calculate real growth indicators by comparing current vs previous period
        for (let i = 0; i < analytics.monthlyTrend.length - 1; i++) {
            const current = analytics.monthlyTrend[i];
            const previous = analytics.monthlyTrend[i + 1];
            if (previous && previous.revenue > 0) {
                current.growth = ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1);
            } else {
                current.growth = null;
            }
        }
        // Last month in the list has no comparison
        if (analytics.monthlyTrend.length > 0) {
            const last = analytics.monthlyTrend[analytics.monthlyTrend.length - 1];
            if (!last.growth) last.growth = null;
        }

        // Summary stats
        const totalRevenue = analytics.revenueByType.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalBookings = (await db.get('SELECT COUNT(*) as count FROM bookings WHERE status IN ("approved", "checked_in", "checked_out")')).count;
        const avgStayValue = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;

        analytics.summary = {
            totalRevenue,
            totalBookings,
            avgStayValue,
            avgOccupancy: analytics.totalRooms > 0 
                ? Math.round(((await db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "occupied"')).count / analytics.totalRooms) * 100)
                : 0
        };

        res.render('reports', { page: 'reports', analytics });
    });

    router.get('/reports/excel', checkAuth, async (req, res) => {
        const workbook = new ExcelJS.Workbook();
        
        // Bookings Sheet
        const bookingsSheet = workbook.addWorksheet('Bookings');
        bookingsSheet.columns = [
            { header: 'Ref', key: 'uuid', width: 38 },
            { header: 'Guest', key: 'guest_name', width: 25 },
            { header: 'Phone', key: 'phone_number', width: 18 },
            { header: 'Room', key: 'room_number', width: 10 },
            { header: 'Type', key: 'type_name', width: 18 },
            { header: 'Check-in', key: 'check_in_date', width: 14 },
            { header: 'Check-out', key: 'check_out_date', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Source', key: 'source', width: 10 },
            { header: 'Price', key: 'total_price', width: 12 },
            { header: 'Created', key: 'created_at', width: 20 }
        ];
        
        // Style header row
        bookingsSheet.getRow(1).font = { bold: true };
        bookingsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
        bookingsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        const bookings = await db.all(`
            SELECT b.*, r.room_number, rt.name as type_name 
            FROM bookings b 
            LEFT JOIN rooms r ON b.room_id = r.id 
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            ORDER BY b.created_at DESC
        `);
        bookingsSheet.addRows(bookings);

        // Revenue Summary Sheet
        const revenueSheet = workbook.addWorksheet('Revenue Summary');
        revenueSheet.columns = [
            { header: 'Room Type', key: 'name', width: 25 },
            { header: 'Total Revenue', key: 'total', width: 18 }
        ];
        revenueSheet.getRow(1).font = { bold: true };
        const revenueData = await db.all(`
            SELECT rt.name, SUM(b.total_price) as total 
            FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_types rt ON r.room_type_id = rt.id 
            WHERE b.status IN ('approved', 'checked_in', 'checked_out') 
            GROUP BY rt.name
        `);
        revenueSheet.addRows(revenueData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=elysian_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    });

    return router;
};
