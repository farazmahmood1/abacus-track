import winston from 'winston'
import { ENV } from './env.js'

const enumerateErrorFormat = winston.format(info => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.stack, // show full stack trace
    }
  }
  return info
})

// Development Format (Colorful, human-readable)
const devFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`
  })
)

// Production Format (Clean, uncolored, machine-friendly)
const prodFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.uncolorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`
  })
)

const logger = winston.createLogger({
  level: ENV.NODE_ENV === 'development' ? 'debug' : 'info',
  format: ENV.NODE_ENV === 'development' ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
})

export default logger
