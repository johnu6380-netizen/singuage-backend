"use strict";
// src/utils/logger.ts
// Winston logger configuration for structured logging
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logResponse = exports.logRequest = exports.logError = exports.createContextLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};
winston_1.default.addColors(colors);
// Create format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
// Create format for file output
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
// Create transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
];
// Add file transports in production
if (env_1.isProduction) {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    levels,
    transports,
    exitOnError: false,
});
// Create child logger with specific context
const createContextLogger = (context) => {
    return exports.logger.child({ context });
};
exports.createContextLogger = createContextLogger;
// Helper functions for common logging patterns
const logError = (message, error, meta) => {
    exports.logger.error(message, {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
        },
        ...meta,
    });
};
exports.logError = logError;
const logRequest = (req) => {
    exports.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?.id,
    });
};
exports.logRequest = logRequest;
const logResponse = (req, res, duration) => {
    exports.logger.info('HTTP Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
    });
};
exports.logResponse = logResponse;
