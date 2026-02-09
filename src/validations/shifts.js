import { z } from 'zod'

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Shift name is required').max(100),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
    graceMinutes: z.number().int().min(0).max(120).optional(),
    breakMinutes: z.number().int().min(0).max(240).optional(),
    isDefault: z.boolean().optional(),
  }),
})

export const updateShiftSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    graceMinutes: z.number().int().min(0).max(120).optional(),
    breakMinutes: z.number().int().min(0).max(240).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
})

export const assignShiftSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    shiftId: z.string().min(1, 'Shift ID is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
  }),
})

export const unassignShiftSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    shiftId: z.string().min(1, 'Shift ID is required'),
  }),
})
