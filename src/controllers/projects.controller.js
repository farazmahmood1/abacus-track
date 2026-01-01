import * as projectsService from '../services/projects.service.js'
import ApiError from '../utils/ApiError.js'
import catchAsync from '../utils/catchAsync.js'

export const listProjects = catchAsync(async (req, res) => {
  const { page, limit, status, departmentId, search } = req.query
  const result = await projectsService.list({
    page,
    limit,
    status,
    departmentId,
    search,
  })
  res.json(result)
})

export const getProject = catchAsync(async (req, res) => {
  const project = await projectsService.getById(req.params.id)
  if (!project) throw new ApiError(404, 'Project not found')
  res.json(project)
})

export const createProject = catchAsync(async (req, res) => {
  const { name, description, status, departmentId, memberIds } = req.body

  if (!name) {
    throw new ApiError(400, 'Project name is required')
  }

  const project = await projectsService.create({
    name,
    description,
    status,
    departmentId,
    memberIds,
  })
  res.status(201).json(project)
})

export const updateProject = catchAsync(async (req, res) => {
  const id = req.params.id
  const existing = await projectsService.getById(id)

  if (!existing) throw new ApiError(404, 'Project not found')

  const updated = await projectsService.update(id, req.body)
  res.json(updated)
})

export const deleteProject = catchAsync(async (req, res) => {
  const id = req.params.id
  const existing = await projectsService.getById(id)

  if (!existing) throw new ApiError(404, 'Project not found')

  await projectsService.remove(id)
  res.status(204).end()
})

export const addProjectMember = catchAsync(async (req, res) => {
  const { projectId } = req.params
  const { userId } = req.body

  if (!userId) {
    throw new ApiError(400, 'userId is required')
  }

  const project = await projectsService.addMember(projectId, userId)
  res.json(project)
})

export const removeProjectMember = catchAsync(async (req, res) => {
  const { projectId, userId } = req.params

  const project = await projectsService.removeMember(projectId, userId)
  res.json(project)
})

export const getProjectHours = catchAsync(async (req, res) => {
  const { projectId } = req.params

  const hours = await projectsService.getProjectHours(projectId)
  res.json(hours)
})

export default {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectHours,
}
