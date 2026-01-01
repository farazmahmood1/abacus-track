import 'dotenv/config'
import app from './app.js'
import prisma from './config/prisma.js'
import { ENV } from './config/env.js'
import logger from './config/logger.js'

let server

async function startServer() {
  try {
    await prisma.$connect()
    logger.info('✅ Connected to Database')

    server = app.listen(ENV.PORT, () => {
      logger.info(`🚀 Server running on port ${ENV.PORT} (${ENV.NODE_ENV})`)
    })
  } catch (err) {
    logger.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

startServer()

async function shutdown() {
  try {
    logger.info('🔻 Shutting down gracefully...')

    if (server) {
      await new Promise(resolve => server.close(resolve))
      logger.info('✅ HTTP server closed')
    }

    await prisma.$disconnect()
    logger.info('✅ Database disconnected')

    process.exit(0)
  } catch (err) {
    logger.error('❌ Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('unhandledRejection', shutdown)
process.on('uncaughtException', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
