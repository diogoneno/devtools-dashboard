/**
 * Authentication API server.
 *
 * WHY: Provides centralized authentication for all 60+ tools in the DevTools Dashboard.
 * Implements JWT-based authentication with refresh token rotation, bcrypt password hashing,
 * and secure session management. This prevents unauthorized access to user data across all
 * microservices (portfolio, misinfo, resilience, ai-safety).
 *
 * ENDPOINTS:
 * - POST /auth/register - Create new user account
 * - POST /auth/login - Authenticate and receive JWT tokens
 * - POST /auth/refresh - Rotate refresh token and get new access token
 * - POST /auth/logout - Revoke refresh token
 * - GET /auth/me - Get current user info (requires valid access token)
 * - GET /health - Health check endpoint
 *
 * @module auth/server
 */

import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { getDatabase } from './init-db.js';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../../shared/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_API_PORT || 5017;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRY = '15m';  // Short-lived access tokens
const JWT_REFRESH_EXPIRY = '7d';  // Longer-lived refresh tokens
const BCRYPT_ROUNDS = 10;

// Create logger
const logger = createLogger({
  serviceName: 'auth-api',
  level: process.env.LOG_LEVEL || 'info',
  enableFile: process.env.NODE_ENV === 'production'
});

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);
app.use(cookieParser());

// Add request logging
app.use(requestLogger(logger));

// Alias for write rate limiter
const writeLimiter = writeRateLimiter();

// Health check - now verifies DB connection
app.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    // Verify DB connection with a simple query
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', service: 'auth-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'auth-api', database: 'disconnected', error: error.message });
  }
});

/**
 * Register new user.
 *
 * WHY: Creates user account with bcrypt-hashed password (never stores plaintext).
 * Enforces unique username and email constraints to prevent duplicates.
 *
 * @route POST /auth/register
 * @param {string} req.body.username - Username (3-50 chars, alphanumeric + underscore)
 * @param {string} req.body.email - Email address (valid email format)
 * @param {string} req.body.password - Password (min 8 chars, recommended: mix of chars)
 * @returns {201} User created successfully with user ID
 * @returns {400} Validation error (missing fields, invalid format)
 * @returns {409} Username or email already exists
 * @returns {500} Server error (database failure, bcrypt error)
 */
app.post('/auth/register', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user in transaction
    try {
      const transaction = db.transaction(() => {
        return db.prepare(`
          INSERT INTO users (username, email, password_hash, role)
          VALUES (?, ?, ?, 'user')
        `).run(username, email, passwordHash);
      });

      const result = transaction();

      logger.info('User registered', { userId: result.lastInsertRowid, username });
      res.status(201).json({
        success: true,
        userId: result.lastInsertRowid,
        message: 'User created successfully'
      });
    } catch (dbError) {
      if (dbError.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      throw dbError;
    }
  } catch (error) {
    logger.error('Registration error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login user and issue JWT tokens.
 *
 * WHY: Authenticates user credentials and returns access + refresh tokens.
 * Access token (15min) used for API requests. Refresh token (7 days) used to get new access tokens.
 * Stores refresh token hash in database for revocation support.
 *
 * @route POST /auth/login
 * @param {string} req.body.username - Username or email
 * @param {string} req.body.password - Password (plaintext, validated against bcrypt hash)
 * @returns {200} Login successful with access_token and refresh_token
 * @returns {400} Missing credentials
 * @returns {401} Invalid credentials (wrong password or user not found)
 * @returns {403} Account disabled (is_active = 0)
 * @returns {500} Server error
 */
app.post('/auth/login', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ?
    `).get(username, username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    // Generate refresh token (long-lived)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Store tokens and log login in transaction
    const transaction = db.transaction(() => {
      // Store refresh token hash
      db.prepare(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, datetime('now', '+7 days'))
      `).run(user.id, refreshTokenHash);

      // Log login
      db.prepare(`
        INSERT INTO login_history (user_id, ip_address, user_agent)
        VALUES (?, ?, ?)
      `).run(user.id, req.ip, req.headers['user-agent'] || 'unknown');
    });

    transaction();

    logger.info('User logged in', { userId: user.id, username: user.username });
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Refresh access token using refresh token.
 *
 * WHY: Access tokens expire after 15 minutes for security. This endpoint allows clients
 * to get a new access token using their refresh token without re-entering credentials.
 * Implements token rotation (old refresh token revoked, new one issued).
 *
 * @route POST /auth/refresh
 * @param {string} req.body.refreshToken - Valid refresh token from /auth/login
 * @returns {200} New access_token and refresh_token
 * @returns {400} Missing refresh token
 * @returns {401} Invalid or expired refresh token
 * @returns {500} Server error
 */
app.post('/auth/refresh', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Find refresh token
    const storedToken = db.prepare(`
      SELECT rt.*, u.username, u.email, u.role, u.is_active
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token_hash = ? AND rt.revoked_at IS NULL
    `).get(tokenHash);

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token expired
    if (new Date(storedToken.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Check if user is active
    if (!storedToken.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: storedToken.user_id,
        username: storedToken.username,
        email: storedToken.email,
        role: storedToken.role
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    // Token rotation in transaction
    const transaction = db.transaction(() => {
      // Revoke old refresh token (token rotation)
      db.prepare(`
        UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ?
      `).run(storedToken.id);

      // Insert new refresh token
      db.prepare(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, datetime('now', '+7 days'))
      `).run(storedToken.user_id, newRefreshTokenHash);
    });

    transaction();

    logger.info('Token refreshed', { userId: storedToken.user_id });
    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Refresh error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * Logout user by revoking refresh token.
 *
 * WHY: Allows users to invalidate their refresh token (e.g., when logging out).
 * Access tokens remain valid until expiry (15min), but new ones can't be obtained.
 *
 * @route POST /auth/logout
 * @param {string} req.body.refreshToken - Refresh token to revoke
 * @returns {200} Logout successful
 * @returns {400} Missing refresh token
 * @returns {500} Server error
 */
app.post('/auth/logout', (req, res) => {
  const db = getDatabase();

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Revoke refresh token in transaction
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE refresh_tokens SET revoked_at = datetime('now')
        WHERE token_hash = ? AND revoked_at IS NULL
      `).run(tokenHash);
    });

    transaction();

    logger.info('User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Get current user info (requires valid access token).
 *
 * WHY: Allows frontend to verify token validity and get user profile.
 * Used for displaying user info in UI and checking authentication status.
 *
 * @route GET /auth/me
 * @param {string} req.headers.authorization - Bearer access token
 * @returns {200} User profile data
 * @returns {401} Missing or invalid token
 * @returns {500} Server error
 */
app.get('/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, username, email, role, is_active, created_at
      FROM users WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    res.json({ success: true, user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('Get user error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

// Start server
app.listen(PORT, () => {
  logger.info('Auth API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`🔐 Auth API listening on port ${PORT}`);
});
