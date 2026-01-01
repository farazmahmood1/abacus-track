import httpStatus from 'http-status'
import ApiError from '../utils/ApiError.js'
import { ENV } from '../config/env.js'

export const errorConverter = (err, req, res, next) => {
  let error = err

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode && httpStatus[error.statusCode]
        ? error.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR

    const message = error.message || 'Internal Server Error'

    error = new ApiError(statusCode, message, false, err.stack)
  }

  next(error)
}

export const errorHandler = (err, req, res, _next) => {
  const { statusCode, message } = err

  const response = {
    success: false,
    status: statusCode,
    message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  }

  res.status(statusCode).json(response)
}
