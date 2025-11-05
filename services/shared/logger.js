/**
 * Shared logging module with Winston for structured logging.
 *
 * WHY: Provides consistent, structured logging across all microservices.
 * Prevents accidental token/secret leaks by sanitizing log messages.
 * Enables easier debugging and monitoring in production.
 *
 * @module shared/logger
 */

import winston from 'winston';
import path from 'path';

/**
 * Sensitive field patterns to redact from logs.
 * WHY: Prevents accidental exposure of tokens, passwords, API keys in logs.
 */
const SENSITIVE_PATTERNS = [
  /token/i,
  /bearer/i,
  /authorization/i,
  /password/i,
  /api[_-]?key/i,
  /secret/i,
  /jwt/i,
  /session/i,
  /cookie/i
];

/**
 * Sanitizes log data by redacting sensitive fields.
 *
 * WHY: Prevents credential leaks in logs, PM2 logs, or log aggregation systems.
 * Recursively walks objects/arrays to catch nested sensitive data.
 *
 * @param {*} data - Data to sanitize (object, array, string, etc.)
 * @returns {*} Sanitized copy of the data
 *
 * @example
 * sanitizeLogData({ token: 'abc123', user: 'john' })
 * // Returns: { token: '[REDACTED]', user: 'john' }
 *
 * @example
 * sanitizeLogData({ headers: { Authorization: 'Bearer xyz' } })
 * // Returns: { headers: { Authorization: '[REDACTED]' } }
 */
function sanitizeLogData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings
  if (typeof data === 'string') {
    // Redact JWT tokens (format: xxx.yyy.zzz)
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(data)) {
      return '[REDACTED_JWT]';
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeLogData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Creates a Winston logger instance for a service.
 *
 * WHY: Each microservice gets its own logger with service-specific metadata.
 * Logs are written to both console (dev) and files (production) for easier debugging.
 *
 * @param {Object} options - Logger configuration
 * @param {string} options.serviceName - Name of the service (e.g., 'portfolio-api')
 * @param {string} [options.level='info'] - Log level (error, warn, info, debug)
 * @param {boolean} [options.enableFile=false] - Enable file logging (for production)
 * @returns {winston.Logger} Configured Winston logger
 *
 * @example
 * import { createLogger } from '../shared/logger.js';
 * const logger = createLogger({ serviceName: 'portfolio-api' });
 * logger.info('Server started', { port: 5006 });
 * logger.error('Database error', { error: err.message });
 */
export function createLogger(options) {
  const { serviceName, level = 'info', enableFile = false } = options;

  const transports = [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(sanitizeLogData(meta))}` : '';
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        })
      )
    })
  ];

  // Add file transport for production
  if (enableFile) {
    const logsDir = process.env.LOGS_DIR || '/var/log/devtools-dashboard';
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-error.log`),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }),
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}.log`),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  const logger = winston.createLogger({
    level,
    defaultMeta: { service: serviceName },
    transports
  });

  return logger;
}

/**
 * Express middleware for HTTP request logging.
 *
 * WHY: Logs all incoming HTTP requests with method, path, status code, response time.
 * Automatically redacts sensitive headers (Authorization, Cookie).
 *
 * @param {winston.Logger} logger - Winston logger instance
 * @returns {Function} Express middleware function
 *
 * @example
 * import { createLogger, requestLogger } from '../shared/logger.js';
 * const logger = createLogger({ serviceName: 'portfolio-api' });
 * app.use(requestLogger(logger));
 */
export function requestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - start;

      logger.info('HTTP Request', sanitizeLogData({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }));
    });

    next();
  };
}

/**
 * Express error logging middleware.
 *
 * WHY: Catches and logs all Express errors with full stack traces.
 * Must be placed after all routes and other middleware.
 *
 * @param {winston.Logger} logger - Winston logger instance
 * @returns {Function} Express error middleware function
 *
 * @example
 * import { createLogger, errorLogger } from '../shared/logger.js';
 * const logger = createLogger({ serviceName: 'portfolio-api' });
 * app.use(errorLogger(logger));  // Must be last
 */
export function errorLogger(logger) {
  return (err, req, res, next) => {
    logger.error('Unhandled error', sanitizeLogData({
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path
    }));

    res.status(500).json({ error: 'Internal server error' });
  };
}

export default { createLogger, requestLogger, errorLogger, sanitizeLogData };
