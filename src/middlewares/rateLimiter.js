import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per IP in 15 min
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false,
})
