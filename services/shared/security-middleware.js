/**
 * Shared security middleware for all microservices.
 *
 * WHY: All 14 microservices need consistent security controls (rate limiting, CORS, headers).
 * This module provides reusable middleware to prevent code duplication and ensure
 * uniform security posture across the entire application.
 *
 * @module shared/security-middleware
 */

import rateLimit from 'express-rate-limit';
import cors from 'cors';
import express from 'express';

/**
 * Security headers middleware to prevent common web vulnerabilities.
 *
 * WHY: Adds HTTP security headers that protect against:
 * - Clickjacking (X-Frame-Options)
 * - MIME-type sniffing attacks (X-Content-Type-Options)
 * - XSS attacks (X-XSS-Protection, CSP)
 * - MITM attacks (Strict-Transport-Security)
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * import { securityHeaders } from '../shared/security-middleware.js';
 * app.use(securityHeaders());
 */
export function securityHeaders() {
  return (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  };
}

/**
 * CORS middleware with configurable allowed origins.
 *
 * WHY: Protects against CSRF attacks by restricting which origins can access the API.
 * Defaults to localhost for development, but can be configured via ALLOWED_ORIGINS env var.
 *
 * @param {Object} options - Configuration options
 * @param {string[]} [options.allowedOrigins] - Array of allowed origins (defaults from env)
 * @returns {Function} Express CORS middleware
 *
 * @example
 * import { configureCORS } from '../shared/security-middleware.js';
 * app.use(configureCORS());
 *
 * @example
 * // Custom origins
 * app.use(configureCORS({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * }));
 */
export function configureCORS(options = {}) {
  const allowedOrigins = options.allowedOrigins ||
    (process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:3000']);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    maxAge: 86400
  });
}

/**
 * General rate limiter for read endpoints.
 *
 * WHY: Prevents DoS attacks by limiting requests per IP.
 * Configured for 100 requests per 15 minutes (suitable for read-heavy workloads).
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.windowMs=900000] - Time window in milliseconds (default: 15 min)
 * @param {number} [options.max=100] - Max requests per window
 * @returns {Function} Express rate limit middleware
 *
 * @example
 * import { generalRateLimiter } from '../shared/security-middleware.js';
 * app.use(generalRateLimiter());
 */
export function generalRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Strict rate limiter for write endpoints.
 *
 * WHY: Write operations are more expensive (database locks, disk I/O) and
 * more dangerous (data modification). This stricter limit (30 req/15min)
 * prevents abuse while allowing legitimate use.
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.windowMs=900000] - Time window in milliseconds (default: 15 min)
 * @param {number} [options.max=30] - Max requests per window
 * @returns {Function} Express rate limit middleware
 *
 * @example
 * import { writeRateLimiter } from '../shared/security-middleware.js';
 * app.post('/api/resource', writeRateLimiter(), (req, res) => { ... });
 */
export function writeRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 30,
    message: { error: 'Too many write requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Body size limiter middleware.
 *
 * WHY: Prevents memory exhaustion attacks from oversized payloads.
 * Limits JSON body size to 1MB (sufficient for most API use cases).
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.limit='1mb'] - Maximum body size
 * @returns {Object} Express JSON parser configuration
 *
 * @example
 * import { bodySizeLimit } from '../shared/security-middleware.js';
 * app.use(express.json(bodySizeLimit()));
 */
export function bodySizeLimit(options = {}) {
  return {
    limit: options.limit || '1mb'
  };
}

/**
 * Complete security middleware stack.
 *
 * WHY: Convenience function that applies all security middlewares in the correct order.
 * Use this to quickly secure a microservice with one function call.
 *
 * @param {Object} app - Express app instance
 * @param {Object} [options] - Configuration options for individual middlewares
 *
 * @example
 * import express from 'express';
 * import { applySecurityMiddleware } from '../shared/security-middleware.js';
 *
 * const app = express();
 * applySecurityMiddleware(app);
 */
export function applySecurityMiddleware(app, options = {}) {
  app.use(securityHeaders());
  app.use(configureCORS(options.cors));
  app.use(generalRateLimiter(options.rateLimit));
  app.use(express.json(bodySizeLimit(options.bodySize)));
}
