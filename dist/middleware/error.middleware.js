"use strict";
// backend/src/middleware/error.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
        error: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
