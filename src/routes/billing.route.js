import { Router } from 'express'
import { requirePermission } from '../middlewares/requirePermission.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import * as billingController from '../controllers/billing.controller.js'

const router = Router()

// Public — fetch plans (no auth needed)
router.get('/plans', billingController.getPublicPlans)

// Company setup (auth only, no permission — user has no company yet)
router.post('/setup-company', requireAuth, billingController.setupCompany)

// Company info (any authenticated user with a company)
router.get('/company', requireAuth, billingController.getCompany)

// Authenticated — billing management (company admins)
router.post('/checkout-session', requirePermission('billing', 'edit'), billingController.createCheckoutSession)
router.post('/portal-session', requirePermission('billing', 'edit'), billingController.createPortalSession)
router.get('/subscription', requireAuth, billingController.getSubscription)
router.get('/invoices', requireAuth, billingController.getInvoices)

export default router
