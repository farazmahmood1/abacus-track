import { z } from 'zod'

export const submitTimesheet = z.object({
  weekStart: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  entries: z
    .array(
      z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
        projectId: z.string().optional().nullable(),
        hours: z.number().min(0).max(24),
        description: z.string().max(500).optional().nullable(),
      })
    )
    .min(1, 'At least one entry is required'),
})

export const approveTimesheet = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().max(500).optional(),
})
