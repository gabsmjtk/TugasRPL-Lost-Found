const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'passwordconfirmation',
  'token',
  'jwt_secret',
  'secret',
  'authorization',
  'cookie',
  'creditcard',
  'apikey',
  'database_url',
  'database',
  'db_url',
];

/**
 * Sanitize an object or string to prevent leaking sensitive information in logs.
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact database credentials in connection strings: mysql://user:pass@host:3306/db
    let sanitized = data.replace(
      /(mysql|postgres|postgresql|mongodb):\/\/([^:]+):([^@]+)@/gi,
      '$1://$2:***@'
    );
    // Redact Bearer tokens in headers
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, 'Bearer ***');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        cleaned[key] = '***REDACTED***';
      } else {
        cleaned[key] = sanitizeLogData(value);
      }
    }
    return cleaned;
  }

  return data;
}

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.log(`[${timestamp}] [INFO]: ${message}`, sanitizeLogData(meta));
    } else {
      console.log(`[${timestamp}] [INFO]: ${message}`);
    }
  },

  warn(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.warn(`[${timestamp}] [WARN]: ${message}`, sanitizeLogData(meta));
    } else {
      console.warn(`[${timestamp}] [WARN]: ${message}`);
    }
  },

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    if (error instanceof Error) {
      const sanitizedMessage = sanitizeLogData(error.message);
      if (isProduction) {
        console.error(`[${timestamp}] [ERROR]: ${message} - ${sanitizedMessage}`);
      } else {
        console.error(`[${timestamp}] [ERROR]: ${message} - ${sanitizedMessage}`, {
          name: error.name,
          stack: error.stack,
        });
      }
    } else if (error !== undefined) {
      console.error(`[${timestamp}] [ERROR]: ${message}`, sanitizeLogData(error));
    } else {
      console.error(`[${timestamp}] [ERROR]: ${message}`);
    }
  },

  debug(message: string, meta?: any) {
    if (!isProduction) {
      const timestamp = new Date().toISOString();
      if (meta !== undefined) {
        console.debug(`[${timestamp}] [DEBUG]: ${message}`, sanitizeLogData(meta));
      } else {
        console.debug(`[${timestamp}] [DEBUG]: ${message}`);
      }
    }
  },
};
