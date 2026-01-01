import express from 'express'
import { requirePermission } from '../middlewares/requirePermission.js'
import projectsController from '../controllers/projects.controller.js'

const router = express.Router()

// List all projects with filters
router.get('/', requirePermission('project', 'read'), projectsController.listProjects)

// Get a specific project
router.get('/:id', requirePermission('project', 'read'), projectsController.getProject)

// Create a new project
router.post('/', requirePermission('project', 'create'), projectsController.createProject)

// Update a project
router.patch(
  '/:id',
  requirePermission('project', 'edit'),
  projectsController.updateProject
)

// Delete a project
router.delete(
  '/:id',
  requirePermission('project', 'delete'),
  projectsController.deleteProject
)

// Add member to project
router.post(
  '/:projectId/members',
  requirePermission('project', 'edit'),
  projectsController.addProjectMember
)

// Remove member from project
router.delete(
  '/:projectId/members/:userId',
  requirePermission('project', 'edit'),
  projectsController.removeProjectMember
)

// Get project total hours
router.get(
  '/:projectId/hours',
  requirePermission('project', 'read'),
  projectsController.getProjectHours
)

export default router
