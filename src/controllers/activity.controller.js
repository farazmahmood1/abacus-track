import prisma from '../config/prisma.js'
import catchAsync from '../utils/catchAsync.js'
import { validate } from '../middlewares/validate.js'
import { batchActivitySchema } from '../validations/activity.js'
import httpStatus from 'http-status'

export const batchPushActivity = catchAsync(async (req, res) => {
    const user = req.user
    const validatedData = await validate(batchActivitySchema, req.body)
    const { logs } = validatedData

    // 1. Validate ownership of timer sessions
    // Extract unique session IDs from the logs
    const timerSessionIds = [...new Set(logs.map(l => l.timerSessionId))]

    // Find which of these sessions belong to the user
    const validSessions = await prisma.timerSession.findMany({
        where: {
            id: { in: timerSessionIds },
            userId: user.id,
        },
        select: { id: true },
    })

    const validSessionIds = new Set(validSessions.map(s => s.id))

    // 2. Filter logs to only include those for valid sessions
    const validLogs = logs
        .filter(log => validSessionIds.has(log.timerSessionId))
        .map(log => ({
            ...log,
            userId: user.id,
            timestamp: new Date(log.timestamp),
        }))

    if (validLogs.length === 0) {
        return res.status(httpStatus.OK).json({
            message: 'No valid sessions found for the provided logs',
            processed: 0,
        })
    }

    // 3. Bulk insert
    const result = await prisma.activityLog.createMany({
        data: validLogs,
        skipDuplicates: true,
    })

    // 4. Optional: Update updated session timestamp or similar if needed
    // For now, we just return success

    res.status(httpStatus.CREATED).json({
        message: 'Activity logs processed',
        processed: result.count,
        ignored: logs.length - validLogs.length,
    })
})
