/**
 * Shared authentication middleware for all microservices.
 *
 * WHY: All 60+ tools need to verify user identity before allowing access to data.
 * This module provides reusable JWT verification middleware to protect endpoints
 * and ensure users can only access their own data (multi-tenancy).
 *
 * SECURITY FEATURES:
 * - JWT token verification with signature validation
 * - Token expiry checking (prevents using old/stolen tokens)
 * - Role-based authorization (admin, moderator, user)
 * - User context injection (req.user contains authenticated user info)
 *
 * @module shared/auth-middleware
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT access token and attach user to request.
 *
 * WHY: Every protected endpoint needs to verify the user's identity before
 * granting access to resources. This middleware extracts the JWT from the
 * Authorization header, verifies its signature and expiry, and attaches
 * the decoded user info to req.user for downstream handlers.
 *
 * Token Format:
 * - Header: "Authorization: Bearer <access_token>"
 * - Token structure: JWT with { userId, username, email, role, exp }
 *
 * Security Checks:
 * 1. Token present in Authorization header
 * 2. Token format is "Bearer <token>"
 * 3. Token signature valid (signed with JWT_SECRET)
 * 4. Token not expired (exp claim checked automatically by jwt.verify)
 * 5. Token contains required claims (userId, username, role)
 *
 * Usage Pattern:
 * - Apply to all routes except public ones (health, docs)
 * - Place AFTER body parsers, BEFORE business logic
 * - Access user info via req.user in route handlers
 *
 * @param {Object} req - Express request object
 * @param {Object} req.headers - HTTP headers
 * @param {string} req.headers.authorization - "Bearer <access_token>"
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() on success, sends 401 on failure
 * @modifies {Object} req.user - Attached on successful verification
 * @modifies {number} req.user.userId - User ID from token
 * @modifies {string} req.user.username - Username from token
 * @modifies {string} req.user.email - Email from token
 * @modifies {string} req.user.role - User role (user/admin/moderator)
 *
 * @throws {401} No Authorization header provided
 * @throws {401} Authorization header doesn't start with "Bearer "
 * @throws {401} Token signature invalid (JsonWebTokenError)
 * @throws {401} Token expired (TokenExpiredError)
 * @throws {401} Token malformed or missing claims
 *
 * @example
 * // Protect all routes in a service
 * import { verifyToken } from '../../shared/auth-middleware.js';
 *
 * app.get('/health', (req, res) => { ... });  // Public endpoint
 *
 * // Apply auth to all subsequent routes
 * app.use(verifyToken);
 *
 * app.get('/api/modules', (req, res) => {
 *   // req.user is now available
 *   const userId = req.user.userId;
 *   // Fetch only this user's modules...
 * });
 *
 * @example
 * // Protect specific routes
 * import { verifyToken } from '../../shared/auth-middleware.js';
 *
 * app.get('/api/public-data', (req, res) => { ... });  // No auth
 * app.get('/api/user-data', verifyToken, (req, res) => {
 *   console.log('Authenticated user:', req.user.username);
 * });
 *
 * @example
 * // Frontend usage - sending token
 * const response = await fetch('/api/modules', {
 *   headers: {
 *     'Authorization': `Bearer ${accessToken}`,
 *     'Content-Type': 'application/json'
 *   }
 * });
 *
 * @see {@link https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback|jsonwebtoken docs}
 */
export function verifyToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization header is required'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Authorization header must be "Bearer <token>"'
      });
    }

    const token = authHeader.substring(7);

    // Verify token signature and expiry
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate required claims
    if (!decoded.userId || !decoded.username || !decoded.role) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token missing required claims'
      });
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token signature verification failed'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token or login again'
      });
    }
    console.error('Token verification error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Could not verify token'
    });
  }
}

/**
 * Middleware to require specific role(s) for access.
 *
 * WHY: Some endpoints should only be accessible to admins (e.g., delete all users,
 * view audit logs, modify system settings). This middleware checks if the authenticated
 * user has one of the required roles.
 *
 * Role Hierarchy:
 * - admin: Full access to all resources and admin functions
 * - moderator: Can moderate content, view analytics, but can't access admin functions
 * - user: Regular user with access to their own data only
 *
 * IMPORTANT: Must be used AFTER verifyToken middleware (requires req.user to be set)
 *
 * @param {string|string[]} allowedRoles - Role(s) that can access this endpoint
 *
 * @returns {Function} Express middleware function
 *
 * @throws {401} User not authenticated (verifyToken not called first)
 * @throws {403} User doesn't have required role
 *
 * @example
 * // Admin-only endpoint
 * import { verifyToken, requireRole } from '../../shared/auth-middleware.js';
 *
 * app.delete('/api/users/:id',
 *   verifyToken,
 *   requireRole('admin'),
 *   (req, res) => {
 *     // Only admins can reach here
 *     // Delete user...
 *   }
 * );
 *
 * @example
 * // Multiple allowed roles
 * app.get('/api/analytics',
 *   verifyToken,
 *   requireRole(['admin', 'moderator']),
 *   (req, res) => {
 *     // Admins and moderators can view analytics
 *   }
 * );
 *
 * @example
 * // Apply to all routes in service
 * app.use(verifyToken);
 * app.use(requireRole('admin'));  // All routes require admin
 */
export function requireRole(allowedRoles) {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'verifyToken middleware must be called before requireRole'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires one of the following roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource (data isolation).
 *
 * WHY: Users should only be able to access/modify their own data. This middleware
 * compares the authenticated user's ID with the user_id in the database record
 * to enforce ownership. Admins can bypass this check.
 *
 * IMPORTANT: Must be used AFTER verifyToken middleware (requires req.user to be set)
 *
 * Usage Pattern:
 * 1. Query database for resource
 * 2. Check if resource.user_id === req.user.userId
 * 3. Allow if match, or if user is admin
 * 4. Deny with 403 if no match
 *
 * @param {number} resourceUserId - The user_id from the database record
 * @param {Object} req - Express request (must have req.user from verifyToken)
 *
 * @returns {boolean} true if user owns resource or is admin, false otherwise
 *
 * @example
 * // Check ownership before returning data
 * import { verifyToken, checkOwnership } from '../../shared/auth-middleware.js';
 *
 * app.get('/api/reflections/:id', verifyToken, (req, res) => {
 *   const db = getDatabase();
 *   const reflection = db.prepare('SELECT * FROM reflections WHERE id = ?').get(req.params.id);
 *
 *   if (!reflection) {
 *     return res.status(404).json({ error: 'Not found' });
 *   }
 *
 *   // Check ownership
 *   if (!checkOwnership(reflection.user_id, req)) {
 *     return res.status(403).json({ error: 'You can only access your own reflections' });
 *   }
 *
 *   res.json({ success: true, reflection });
 * });
 *
 * @example
 * // Check ownership before update
 * app.patch('/api/reflections/:id', verifyToken, (req, res) => {
 *   const db = getDatabase();
 *   const reflection = db.prepare('SELECT user_id FROM reflections WHERE id = ?').get(req.params.id);
 *
 *   if (!reflection || !checkOwnership(reflection.user_id, req)) {
 *     return res.status(403).json({ error: 'Access denied' });
 *   }
 *
 *   // Proceed with update...
 * });
 */
export function checkOwnership(resourceUserId, req) {
  // Admin can access all resources
  if (req.user && req.user.role === 'admin') {
    return true;
  }

  // Check if user owns the resource
  return req.user && req.user.userId === resourceUserId;
}

/**
 * Optional authentication middleware (allows both authenticated and anonymous access).
 *
 * WHY: Some endpoints may provide different data based on authentication status
 * (e.g., public modules vs. user's modules). This middleware verifies token if present,
 * but doesn't reject requests without tokens.
 *
 * Usage Pattern:
 * - Use for endpoints that work both authenticated and unauthenticated
 * - Check if req.user exists to determine if user is authenticated
 * - Return different data based on authentication status
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Always calls next() (even if no token or invalid token)
 * @modifies {Object} req.user - Attached if valid token provided
 *
 * @example
 * // Public endpoint with optional auth
 * import { optionalAuth } from '../../shared/auth-middleware.js';
 *
 * app.get('/api/modules', optionalAuth, (req, res) => {
 *   const db = getDatabase();
 *
 *   if (req.user) {
 *     // Authenticated: return user's modules
 *     const modules = db.prepare('SELECT * FROM modules WHERE user_id = ?').all(req.user.userId);
 *     res.json({ success: true, modules, authenticated: true });
 *   } else {
 *     // Anonymous: return public modules only
 *     const modules = db.prepare('SELECT * FROM modules WHERE is_public = 1').all();
 *     res.json({ success: true, modules, authenticated: false });
 *   }
 * });
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue as anonymous
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.userId && decoded.username && decoded.role) {
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Invalid token, but don't reject request
    console.log('Optional auth failed (continuing as anonymous):', error.message);
  }

  next();
}
