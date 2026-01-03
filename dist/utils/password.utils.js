"use strict";
// src/utils/password.utils.ts
// Password hashing and verification utilities using bcrypt
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshTokenHash = exports.hashRefreshToken = exports.generateRandomPassword = exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../config/env");
/**
 * Hash a plain text password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt_1.default.genSalt(env_1.env.BCRYPT_ROUNDS);
    return bcrypt_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Compare plain text password with hashed password
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    return bcrypt_1.default.compare(plainPassword, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
/**
 * Generate random password
 */
const generateRandomPassword = (length = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()';
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    // Shuffle password
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
};
exports.generateRandomPassword = generateRandomPassword;
/**
 * Hash refresh token for secure storage
 */
const hashRefreshToken = async (token) => {
    return (0, exports.hashPassword)(token);
};
exports.hashRefreshToken = hashRefreshToken;
/**
 * Verify refresh token against hash
 */
const verifyRefreshTokenHash = async (token, hash) => {
    return (0, exports.comparePassword)(token, hash);
};
exports.verifyRefreshTokenHash = verifyRefreshTokenHash;
