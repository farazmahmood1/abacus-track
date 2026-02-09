import { z } from 'zod'

export const createRegularization = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  type: z.enum(['MISSED_CHECKIN', 'MISSED_CHECKOUT', 'WRONG_TIME']),
  requestedTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
})

export const approveRegularization = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().max(500).optional(),
})
