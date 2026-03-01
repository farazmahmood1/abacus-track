import { Router } from 'express'
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.js'
import * as superAdminController from '../controllers/superAdmin.controller.js'

const router = Router()

// All routes require super admin access
router.use(requireSuperAdmin)

// Companies
router.get('/companies', superAdminController.listCompanies)
router.get('/companies/:id', superAdminController.getCompany)
router.post('/companies', superAdminController.createCompany)
router.put('/companies/:id', superAdminController.updateCompany)
router.patch('/companies/:id/status', superAdminController.updateCompanyStatus)
router.patch('/companies/:id/branding', superAdminController.updateCompanyBranding)
router.delete('/companies/:id', superAdminController.deleteCompany)
router.get('/companies/:id/features', superAdminController.getCompanyFeatures)
router.post('/companies/:id/features', superAdminController.setFeatureOverride)
router.delete('/companies/:id/features/:featureKey', superAdminController.removeFeatureOverride)

// Plans
router.get('/plans', superAdminController.listPlans)
router.get('/plans/:id', superAdminController.getPlan)
router.post('/plans', superAdminController.createPlan)
router.put('/plans/:id', superAdminController.updatePlan)
router.put('/plans/:id/features', superAdminController.updatePlanFeatures)

// Subscriptions
router.get('/subscriptions', superAdminController.listSubscriptions)
router.patch('/subscriptions/:companyId', superAdminController.overrideSubscription)

// Analytics
router.get('/analytics/overview', superAdminController.getOverview)
router.get('/analytics/usage', superAdminController.getUsage)

// Audit Logs
router.get('/audit-logs', superAdminController.listAuditLogs)

// Seed
router.post('/seed-plans', superAdminController.seedPlans)

export default router
