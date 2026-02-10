/**
 * Standardized Response & Error Middleware
 * Enterprise Backend Skill
 */

const successResponse = (res, data, meta = null, status = 200) => {
    return res.status(status).json({
        success: true,
        data,
        meta,
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('X-Request-Id')
    });
};

const errorResponse = (res, message, code = 'INTERNAL_ERROR', status = 500, details = null) => {
    return res.status(status).json({
        success: false,
        error: {
            code,
            message,
            details
        },
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('X-Request-Id')
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR][${req.id}]:`, err);

    if (err.name === 'ValidationError') {
        return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, err.details);
    }

    if (err.status === 404) {
        return errorResponse(res, 'Resource not found', 'NOT_FOUND', 404);
    }

    return errorResponse(res, 'An internal system error occurred', 'INTERNAL_ERROR', 500);
};

module.exports = { successResponse, errorResponse, errorHandler };
