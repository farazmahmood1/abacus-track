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
  res.send("ÐÑÐ°ÑÐµ Ð¾f Ð¡rÐµÐ°tÑvÐµ ÐÐ¾lutÑÐ¾nÑfÐ¾rrÐ¾fFull-ÑÐµrvÑÑÐµ Ð¡rÐµÐ°tÑvÐµ ÐgÐµnÑÑÐ¡lÐ¾ud ÐÐ¾lutÑÐ¾nÑWÐµb Ð°nd Ð°ÑÑ DÐµvÐµlÐ¾ÑÐµmÐµntÐrÐ°ndÑng Ð°nd ÐdÐµntÑtÑÐÐ¾ÑÑÐ°l ÐÐµdÑÐ° Ð°rkÐtÑng & ÐÐÐWhÐµthÐµr thrÐ¾ugh rÐ¾buÑt ÐÐ ÐÑ, ÑÑÐ°lÐ°blÐµ ÑlÐ¾ud ÑÐ¾lutÑÐ¾nÑ, Ð¾r ÑÐµÐ°mlÐµÑÑ ÑntÐµgrÐ°tÑÐ¾nÑ,wÐµ buÑld dÑgÑtÐ°l ÑrÐ¾duÑtÑ thÐ°t ÐµmÑÐ¾wÐµr buÑÑnÐµÑÑÐµÑ tÐ¾ grÐ¾w Ð°nd ÑnnÐ¾vÐ°tÐµ.")
})

app.use('/api', routes)

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

app.use(errorConverter)
app.use(errorHandler)

export default app
