import catchAsync from '../utils/catchAsync.js'
import * as companyService from '../services/company.service.js'
import * as planService from '../services/plan.service.js'
import * as subscriptionService from '../services/subscription.service.js'
import * as auditService from '../services/audit.service.js'
import * as analyticsService from '../services/analytics.service.js'

// ===== Companies =====
export const listCompanies = catchAsync(async (req, res) => {
  const { page, limit, search, status } = req.query
  const result = await companyService.listCompanies({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
    status,
  })
  res.json({ success: true, ...result })
})

export const getCompany = catchAsync(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id)
  res.json({ success: true, data: company })
})

export const createCompany = catchAsync(async (req, res) => {
  const company = await companyService.createCompany(req.body)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'company.create',
    targetType: 'company',
    targetId: company.id,
    metadata: { companyName: company.name },
    ipAddress: req.ip,
  })

  res.status(201).json({ success: true, data: company })
})

export const updateCompany = catchAsync(async (req, res) => {
  const company = await companyService.updateCompany(req.params.id, req.body)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'company.update',
    targetType: 'company',
    targetId: company.id,
    metadata: { changes: req.body },
    ipAddress: req.ip,
  })

  res.json({ success: true, data: company })
})

export const updateCompanyStatus = catchAsync(async (req, res) => {
  const { status } = req.body
  const company = await companyService.updateCompanyStatus(req.params.id, status)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: `company.${status.toLowerCase()}`,
    targetType: 'company',
    targetId: company.id,
    metadata: { newStatus: status },
    ipAddress: req.ip,
  })

  res.json({ success: true, data: company })
})

export const updateCompanyBranding = catchAsync(async (req, res) => {
  const company = await companyService.updateCompanyBranding(req.params.id, req.body)
  res.json({ success: true, data: company })
})

export const deleteCompany = catchAsync(async (req, res) => {
  await companyService.deleteCompany(req.params.id)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'company.deactivate',
    targetType: 'company',
    targetId: req.params.id,
    ipAddress: req.ip,
  })

  res.json({ success: true, message: 'Company deactivated' })
})

export const getCompanyFeatures = catchAsync(async (req, res) => {
  const features = await companyService.getCompanyFeatures(req.params.id)
  res.json({ success: true, data: features })
})

export const setFeatureOverride = catchAsync(async (req, res) => {
  const { featureKey, enabled, limit, reason } = req.body
  const override = await companyService.setFeatureOverride(
    req.params.id, featureKey, { enabled, limit, reason }, req.user.id
  )

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'company.feature_override',
    targetType: 'company',
    targetId: req.params.id,
    metadata: { featureKey, enabled, limit },
    ipAddress: req.ip,
  })

  res.json({ success: true, data: override })
})

export const removeFeatureOverride = catchAsync(async (req, res) => {
  await companyService.removeFeatureOverride(req.params.id, req.params.featureKey)
  res.json({ success: true, message: 'Feature override removed' })
})

// ===== Plans =====
export const listPlans = catchAsync(async (req, res) => {
  const plans = await planService.listAllPlans()
  res.json({ success: true, data: plans })
})

export const getPlan = catchAsync(async (req, res) => {
  const plan = await planService.getPlanById(req.params.id)
  res.json({ success: true, data: plan })
})

export const createPlan = catchAsync(async (req, res) => {
  const plan = await planService.createPlan(req.body)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'plan.create',
    targetType: 'plan',
    targetId: plan.id,
    metadata: { planName: plan.name },
    ipAddress: req.ip,
  })

  res.status(201).json({ success: true, data: plan })
})

export const updatePlan = catchAsync(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body)
  res.json({ success: true, data: plan })
})

export const updatePlanFeatures = catchAsync(async (req, res) => {
  const features = await planService.updatePlanFeatures(req.params.id, req.body.features)
  res.json({ success: true, data: features })
})

// ===== Subscriptions =====
export const listSubscriptions = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query
  const result = await subscriptionService.listSubscriptions({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
  })
  res.json({ success: true, ...result })
})

export const overrideSubscription = catchAsync(async (req, res) => {
  const { planId } = req.body
  const subscription = await subscriptionService.overrideSubscription(req.params.companyId, planId)

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'subscription.override',
    targetType: 'company',
    targetId: req.params.companyId,
    metadata: { planId },
    ipAddress: req.ip,
  })

  res.json({ success: true, data: subscription })
})

// ===== Analytics =====
export const getOverview = catchAsync(async (req, res) => {
  const overview = await analyticsService.getPlatformOverview()
  res.json({ success: true, data: overview })
})

export const getUsage = catchAsync(async (req, res) => {
  const usage = await analyticsService.getUsageAnalytics()
  res.json({ success: true, data: usage })
})

// ===== Audit Logs =====
export const listAuditLogs = catchAsync(async (req, res) => {
  const { page, limit, action, targetType, actorId, startDate, endDate } = req.query
  const result = await auditService.listAuditLogs({
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    action, targetType, actorId, startDate, endDate,
  })
  res.json({ success: true, ...result })
})

// ===== Seed Plans =====
export const seedPlans = catchAsync(async (req, res) => {
  await planService.seedDefaultPlans()
  res.json({ success: true, message: 'Default plans seeded' })
})
