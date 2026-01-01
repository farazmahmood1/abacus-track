import { z } from 'zod'

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
  }),
})

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
})

export const listDepartmentsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
  }),
})

export const assignEmployeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    departmentId: z.string().min(1, 'Department ID is required'),
  }),
})
