import express from 'express'
import reviewsController from '../controllers/reviews.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// Cycles (admin)
router.post('/cycles', requirePermission('settings', 'create'), reviewsController.createCycle)
router.get('/cycles', requirePermission('dashboard', 'read'), reviewsController.listCycles)
router.patch('/cycles/:id/activate', requirePermission('settings', 'edit'), reviewsController.activateCycle)
router.patch('/cycles/:id/complete', requirePermission('settings', 'edit'), reviewsController.completeCycle)

// Employee views
router.get('/my-reviews', requirePermission('leave', 'read'), reviewsController.getMyReviews)
router.get('/to-review', requirePermission('leave', 'read'), reviewsController.getReviewsToReview)

// Review CRUD
router.post('/', requirePermission('settings', 'create'), reviewsController.createReview)
router.get('/:id', requirePermission('leave', 'read'), reviewsController.getReview)
router.put('/:id', requirePermission('leave', 'edit'), reviewsController.submitReview)
router.patch('/:id/acknowledge', requirePermission('leave', 'edit'), reviewsController.acknowledgeReview)

export default router
