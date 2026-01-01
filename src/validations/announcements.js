import { z } from 'zod'

export const announcementCategorySchema = z.enum([
  'holiday',
  'update',
  'urgent',
  'birthday',
  'policy',
])

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  category: announcementCategorySchema,
  departmentId: z.string().optional(),
})

export const updateAnnouncementSchema = createAnnouncementSchema.partial()

export const listAnnouncementSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  departmentId: z.string().optional(),
})
