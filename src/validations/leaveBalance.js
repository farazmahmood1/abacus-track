import { z } from 'zod'

export const createLeavePolicy = z.object({
  leaveType: z.enum([
    'ANNUAL_LEAVE',
    'MATERNITY_LEAVE',
    'CASUAL_LEAVE',
    'SICK_LEAVE',
    'PERSONAL_LEAVE',
    'UNPAID_LEAVE',
  ]),
  annualDays: z.number().min(0).max(365),
  maxCarryOver: z.number().min(0).max(365).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export const updateLeavePolicy = z.object({
  annualDays: z.number().min(0).max(365).optional(),
  maxCarryOver: z.number().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
})

export const adjustBalance = z.object({
  totalDays: z.number().min(0).optional(),
  usedDays: z.number().min(0).optional(),
  carriedOver: z.number().min(0).optional(),
})

export const initializeBalances = z.object({
  year: z.number().int().min(2020).max(2100),
})
