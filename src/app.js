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

const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://forrof-tracker.vercel.app',
    ],
    credentials: true,
  })
)

app.all('/api/auth/*splat', toNodeHandler(auth))

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
  res.send('Welcome to Forrof Tracker API')
})

app.use('/api', routes)

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

app.use(errorConverter)
app.use(errorHandler)

export default app
