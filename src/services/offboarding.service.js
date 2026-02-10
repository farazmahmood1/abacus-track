import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

const DEFAULT_TASKS = [
  { title: 'Revoke email access', category: 'IT_ACCESS', sortOrder: 1 },
  { title: 'Revoke VPN/system access', category: 'IT_ACCESS', sortOrder: 2 },
  { title: 'Remove from Slack/Teams channels', category: 'IT_ACCESS', sortOrder: 3 },
  { title: 'Collect laptop', category: 'EQUIPMENT', sortOrder: 4 },
  { title: 'Collect access cards/keys', category: 'EQUIPMENT', sortOrder: 5 },
  { title: 'Return monitors and peripherals', category: 'EQUIPMENT', sortOrder: 6 },
  { title: 'Document handover of ongoing work', category: 'KNOWLEDGE_TRANSFER', sortOrder: 7 },
  { title: 'Transfer file ownership', category: 'KNOWLEDGE_TRANSFER', sortOrder: 8 },
  { title: 'Conduct exit interview', category: 'EXIT_INTERVIEW', sortOrder: 9 },
  { title: 'Collect feedback survey', category: 'EXIT_INTERVIEW', sortOrder: 10 },
  { title: 'Process final paycheck', category: 'FINAL_PAY', sortOrder: 11 },
  { title: 'Generate experience letter', category: 'DOCUMENTATION', sortOrder: 12 },
]

export async function getAll({ status, search, page = 1, limit = 15 }) {
  const where = {}
  if (status) where.status = status
  if (search) {
    where.employee = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [records, total] = await Promise.all([
    prisma.offboardingProcess.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true, image: true } },
        initiator: { select: { id: true, name: true } },
        tasks: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.offboardingProcess.count({ where }),
  ])

  // Compute completion percentage
  const data = records.map(process => {
    const totalTasks = process.tasks.length
    const completedTasks = process.tasks.filter(t => t.status === 'COMPLETED').length
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    return {
      ...process,
      completionPercent,
      totalTasks,
      completedTasks,
    }
  })

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getById(id) {
  const process = await prisma.offboardingProcess.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true, image: true, department: { select: { name: true } } } },
      initiator: { select: { id: true, name: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          completer: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!process) throw new ApiError(404, 'Offboarding process not found')

  const totalTasks = process.tasks.length
  const completedTasks = process.tasks.filter(t => t.status === 'COMPLETED').length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return { ...process, completionPercent, totalTasks, completedTasks }
}

export async function initiate(data) {
  const process = await prisma.offboardingProcess.create({
    data: {
      employeeId: data.employeeId,
      initiatedBy: data.initiatedBy,
      lastWorkingDate: new Date(data.lastWorkingDate),
      tasks: {
        create: DEFAULT_TASKS.map(task => ({
          title: task.title,
          category: task.category,
          sortOrder: task.sortOrder,
        })),
      },
    },
    include: {
      employee: { select: { id: true, name: true, email: true, image: true } },
      initiator: { select: { id: true, name: true } },
      tasks: { orderBy: { sortOrder: 'asc' } },
    },
  })
  return process
}

export async function toggleTask(processId, taskId, data) {
  const task = await prisma.offboardingTask.findFirst({
    where: { id: taskId, processId },
  })
  if (!task) throw new ApiError(404, 'Task not found')

  const isCompleting = task.status !== 'COMPLETED'
  const updatedTask = await prisma.offboardingTask.update({
    where: { id: taskId },
    data: {
      status: isCompleting ? 'COMPLETED' : 'PENDING',
      completedAt: isCompleting ? new Date() : null,
      completedBy: isCompleting ? data.completedBy : null,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      completer: { select: { id: true, name: true } },
    },
  })

  // Check if all tasks are completed, auto-complete the process
  const allTasks = await prisma.offboardingTask.findMany({ where: { processId } })
  const allCompleted = allTasks.every(t => t.status === 'COMPLETED')
  if (allCompleted) {
    await prisma.offboardingProcess.update({
      where: { id: processId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  } else {
    // Revert to IN_PROGRESS if a task was unchecked
    const process = await prisma.offboardingProcess.findUnique({ where: { id: processId } })
    if (process.status === 'COMPLETED') {
      await prisma.offboardingProcess.update({
        where: { id: processId },
        data: { status: 'IN_PROGRESS', completedAt: null },
      })
    }
  }

  return updatedTask
}

export async function updateTask(processId, taskId, data) {
  const task = await prisma.offboardingTask.findFirst({
    where: { id: taskId, processId },
  })
  if (!task) throw new ApiError(404, 'Task not found')

  const updateData = {}
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo || null
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.status !== undefined) updateData.status = data.status

  return prisma.offboardingTask.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      completer: { select: { id: true, name: true } },
    },
  })
}

export async function cancel(id) {
  const process = await prisma.offboardingProcess.findUnique({ where: { id } })
  if (!process) throw new ApiError(404, 'Offboarding process not found')
  if (process.status === 'COMPLETED') throw new ApiError(400, 'Cannot cancel a completed process')

  return prisma.offboardingProcess.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      employee: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}
