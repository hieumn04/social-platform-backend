import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { TransformableInfo } from 'logform';

const logDir = path.resolve(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Custom levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray',
  },
};
winston.addColors(customLevels.colors);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf((info: TransformableInfo & { context?: any; extra?: any }) => {
    const ts = info.timestamp || '';
    const lvl = info.level || '';
    const msg =
      typeof info.message === 'string'
        ? info.message
        : safeStringify(info.message);
    const ctxStr = info.context ? safeStringify(info.context) : '';
    const extraStr = info.extra ? safeStringify(info.extra) : '';
    const stk = info.stack ? safeStringify(info.stack) : '';

    let base = `[${ts}] ${lvl}: ${msg}`;
    if (ctxStr) base += ` ${ctxStr}`;
    if (extraStr) base += ` ${extraStr}`;
    if (stk) base += `\n${stk}`;
    return base;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const Logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});
