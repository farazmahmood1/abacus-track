import express from 'express'
import calendarController from '../controllers/calendar.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/', requirePermission('leave', 'read'), calendarController.getCalendarData)
router.get('/holidays', requirePermission('leave', 'read'), calendarController.listHolidays)
router.post('/holidays', requirePermission('settings', 'edit'), calendarController.createHoliday)
router.put('/holidays/:id', requirePermission('settings', 'edit'), calendarController.updateHoliday)
router.delete('/holidays/:id', requirePermission('settings', 'edit'), calendarController.deleteHoliday)

export default router
