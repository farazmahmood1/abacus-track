import express from 'express'
import expenseController from '../controllers/expense.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'
import { uploadDocument } from '../middlewares/upload.js'

const router = express.Router()

router.get('/', requirePermission('dashboard', 'read'), expenseController.getAll)
router.get('/summary', requirePermission('dashboard', 'read'), expenseController.getSummary)
router.get('/me', requirePermission('leave', 'read'), expenseController.getMyExpenses)
router.get('/me/summary', requirePermission('leave', 'read'), expenseController.getMySummary)
router.post('/', requirePermission('leave', 'read'), uploadDocument.single('receipt'), expenseController.create)
router.patch('/:id/status', requirePermission('settings', 'edit'), expenseController.updateStatus)
router.delete('/:id', requirePermission('leave', 'read'), expenseController.remove)

export default router
