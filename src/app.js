import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import httpStatus from 'http-status'

import { authLimiter } from './middlewares/rateLimiter.js'
import { errorConverter, errorHandler } from './middlewares/errorHandler.js'
import ApiError from './utils/ApiError.js'
import { successHandler, errorHandler as morganErrorHandler } from './config/morgan.js'
import routes from './routes/index.js'

import { ENV } from './config/env.js'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { handleStripeWebhook } from './controllers/billing.controller.js'

const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://forrof-tracker.vercel.app',
        'https://tracker.forrof.io',
        'https://www.tracker.forrof.io',
        'https://vs-code-time-duration.vercel.app'
      ]
      // Allow all localhost/127.0.0.1 origins in development
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

// Explicit CORS for auth routes (toNodeHandler bypasses Express cors middleware)
const isAllowedOrigin = (origin) =>
  !origin ||
  [
    'https://forrof-tracker.vercel.app',
    'https://tracker.forrof.io',
    'https://www.tracker.forrof.io',
    'https://vs-code-time-duration.vercel.app',
  ].includes(origin) ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

app.all('/api/auth/*splat', (req, res, next) => {
  const origin = req.headers.origin
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
}, toNodeHandler(auth))

// Stripe webhook — must be BEFORE json body parser (needs raw body)
app.post('/api/billing/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)

if (ENV.NODE_ENV === 'development') {
  app.use(successHandler)
  app.use(morganErrorHandler)
}

app.use(helmet())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(compression())

// if (ENV.NODE_ENV === 'production') {
//   app.use('/api/auth', authLimiter)
// }

app.get('/', (req, res) => {
  res.send('Welcome to Forrof Tracker API v1')
})

app.use('/api', routes)

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

app.use(errorConverter)
app.use(errorHandler)

export default app
