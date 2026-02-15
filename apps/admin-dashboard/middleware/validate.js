const { z } = require('zod');

/**
 * Validation Schemas
 * Centralized input validation for all POST routes
 */

const bookingSchema = z.object({
    guest_name: z.string().min(2, 'Guest name must be at least 2 characters').max(100),
    phone_number: z.string().min(5, 'Phone number is required').max(20),
    telegram: z.string().max(50).optional().default(''),
    guest_email: z.string().email('Invalid email format').optional().or(z.literal('')).default(''),
    room_id: z.coerce.number().int().positive('Room selection is required'),
    check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    payment_method: z.string().optional().default('cash'),
    special_requests: z.string().max(500).optional().default('')
}).refine(data => new Date(data.check_out_date) > new Date(data.check_in_date), {
    message: 'Check-out must be after check-in',
    path: ['check_out_date']
});

const apiBookingSchema = z.object({
    guest_name: z.string().min(2).max(100),
    phone_number: z.string().min(5).max(20),
    telegram: z.string().max(50).optional().default(''),
    room_uuid: z.string().uuid('Invalid room reference'),
    check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    special_requests: z.string().max(500).optional().default('')
}).refine(data => new Date(data.check_out_date) > new Date(data.check_in_date), {
    message: 'Check-out must be after check-in',
    path: ['check_out_date']
});

const roomTypeSchema = z.object({
    id: z.coerce.number().int().positive().optional().or(z.literal('')),
    name: z.string().min(2, 'Name is required').max(50),
    description: z.string().max(500).optional().default(''),
    base_price: z.coerce.number().positive('Price must be greater than 0'),
    is_active: z.any().optional()
});

const roomSchema = z.object({
    id: z.coerce.number().int().positive().optional().or(z.literal('')),
    room_number: z.string().min(1, 'Room number is required').max(10),
    room_type_id: z.coerce.number().int().positive('Room type is required'),
    status: z.enum(['available', 'occupied', 'maintenance', 'dirty']).default('available'),
    is_active: z.any().optional()
});

const menuItemSchema = z.object({
    id: z.coerce.number().int().positive().optional().or(z.literal('')),
    category: z.enum(['food', 'deserts', 'wine'], { errorMap: () => ({ message: 'Invalid category' }) }),
    name: z.string().min(2).max(100),
    description: z.string().max(300).optional().default(''),
    price: z.coerce.number().positive('Price must be greater than 0'),
    is_available: z.any().optional()
});

const staffSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    full_name: z.string().min(2, 'Full name is required').max(100),
    role: z.enum(['admin', 'manager', 'staff'])
});

const loginSchema = z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(1).max(100)
});

const paymentSchema = z.object({
    booking_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online']),
    notes: z.string().max(300).optional().default('')
});

/**
 * Validation middleware factory
 * Returns middleware that validates req.body against the given schema
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        
        // If it's an API route, return JSON
        if (req.path.startsWith('/api/')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input',
                    details: errors
                }
            });
        }
        
        // For form submissions, redirect back with error
        const referrer = req.get('Referrer') || '/';
        return res.redirect(`${referrer}?error=${encodeURIComponent(errors[0])}`);
    }
    
    req.validatedBody = result.data;
    next();
};

module.exports = {
    bookingSchema,
    apiBookingSchema,
    roomTypeSchema,
    roomSchema,
    menuItemSchema,
    staffSchema,
    loginSchema,
    paymentSchema,
    validate
};
