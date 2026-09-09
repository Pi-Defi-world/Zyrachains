/**
 * Winston logger for embedded oracle
 */
import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

if (config.nodeEnv === 'development') {
  try {
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    transports.push(
      new winston.transports.File({
        filename: 'logs/oracle-error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/oracle-combined.log',
      })
    );
  } catch {
    console.warn('Oracle file logging disabled');
  }
}

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
});
