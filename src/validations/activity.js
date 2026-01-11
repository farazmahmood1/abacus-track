import { z } from 'zod'

export const activityLogSchema = z.object({
    timerSessionId: z.string().uuid(),
    timestamp: z.string().datetime(),
    keyboardCount: z.number().int().min(0),
    mouseDistance: z.number().int().min(0),
    clickCount: z.number().int().min(0),
    windowTitle: z.string().optional().nullable(),
    appName: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    isIdle: z.boolean().optional().default(false),
})

export const batchActivitySchema = z.object({
    logs: z.array(activityLogSchema).min(1, 'At least one activity log is required'),
})
