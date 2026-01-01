import { z } from 'zod'

export const leaveTypeSchema = z.enum([
  'ANNUAL_LEAVE',
  'MATERNITY_LEAVE',
  'CASUAL_LEAVE',
  'SICK_LEAVE',
  'PERSONAL_LEAVE',
  'UNPAID_LEAVE',
])

export const leaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const createLeaveSchema = z
  .object({
    leaveType: leaveTypeSchema,
    reason: z.string().optional().nullable(),
    prescriptionUrl: z.string().optional().nullable(),

    startDate: z.preprocess(
      val => (val instanceof Date ? val : new Date(val)),
      z.date({ invalid_type_error: 'Invalid start date' })
    ),
    endDate: z.preprocess(
      val => (val instanceof Date ? val : new Date(val)),
      z.date({ invalid_type_error: 'Invalid end date' })
    ),
  })
  .strict()
  .refine(data => data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  })

export const updateLeaveSchema = createLeaveSchema.partial()

export const approveLeaveSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  approvalNotes: z.string().optional(),
})

export const listLeaveSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: leaveStatusSchema.optional(),
  leaveType: leaveTypeSchema.optional(),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
})
