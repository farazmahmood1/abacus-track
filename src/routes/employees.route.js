import express from 'express'
import employeesController from '../controllers/employees.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', requireAuth, employeesController.listEmployees)

export default router
