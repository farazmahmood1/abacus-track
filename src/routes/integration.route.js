import express from 'express'
import integrationController from '../controllers/integration.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/', requirePermission('settings', 'edit'), integrationController.getAll)
router.get('/:id', requirePermission('settings', 'edit'), integrationController.getOne)
router.post('/slack', requirePermission('settings', 'edit'), integrationController.configureSlack)
router.post('/teams', requirePermission('settings', 'edit'), integrationController.configureTeams)
router.post('/google-calendar', requirePermission('settings', 'edit'), integrationController.configureGoogleCalendar)
router.post('/jira', requirePermission('settings', 'edit'), integrationController.configureJira)
router.post('/clickup', requirePermission('settings', 'edit'), integrationController.configureClickUp)
router.delete('/:id', requirePermission('settings', 'edit'), integrationController.remove)
router.post('/:id/test', requirePermission('settings', 'edit'), integrationController.test)
router.patch('/:id/toggle', requirePermission('settings', 'edit'), integrationController.toggle)

export default router
