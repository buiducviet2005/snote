import pino from 'pino';
import { env } from '../../config/env';

export const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'context.password',
      'context.passwordHash',
      'context.token',
      'password',
      'passwordHash',
      'token'
    ],
    censor: '[REDACTED]'
  }
});
