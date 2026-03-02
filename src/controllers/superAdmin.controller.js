import catchAsync from '../utils/catchAsync.js'
import * as companyService from '../services/company.service.js'
import * as planService from '../services/plan.service.js'
import * as subscriptionService from '../services/subscription.service.js'
import * as auditService from '../services/audit.service.js'
import * as analyticsService from '../services/analytics.service.js'
import cloudinary from '../lib/cloudinary.js'
import { sendEmail } from '../lib/mailer.js'
import { auth } from '../lib/auth.js'
import crypto from 'crypto'
import fs from 'fs'

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
  let logoUrl = null

  // Upload logo to Cloudinary if provided
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'forrof-tracker/company-logos',
        resource_type: 'auto',
        public_id: `company_${Date.now()}`,
        overwrite: true,
      })
      logoUrl = result.secure_url
    } finally {
      try { fs.unlinkSync(req.file.path) } catch (err) { /* ignore cleanup errors */ }
    }
  }

  // Create the company
  const company = await companyService.createCompany({
    name: req.body.name,
    domain: req.body.domain || null,
    maxUsers: req.body.maxUsers ? Number(req.body.maxUsers) : 5,
    logo: logoUrl,
    colorPrimary: req.body.colorPrimary || '#4f46e5',
    colorSecondary: req.body.colorSecondary || null,
  })

  // Create owner user if owner details are provided
  let ownerUser = null
  let ownerWarning = null
  if (req.body.ownerName && req.body.ownerEmail) {
    const tempPassword = crypto.randomBytes(5).toString('hex')

    // Step 1: Create the owner user via Better Auth's server-side API
    try {
      const headers = new Headers({
        'x-skip-welcome-email': 'true',
      })
      if (req.headers.cookie) headers.set('cookie', req.headers.cookie)
      if (req.headers.authorization) headers.set('authorization', req.headers.authorization)

      const result = await auth.api.createUser({
        body: {
          name: req.body.ownerName,
          email: req.body.ownerEmail,
          password: tempPassword,
          role: 'admin',
          data: { companyId: company.id },
        },
        headers,
      })

      ownerUser = result.user || result
    } catch (err) {
      console.error('[SUPER ADMIN] Failed to create owner user:', err)
      ownerWarning = 'Company created but owner user creation failed. The email may already be in use.'
    }

    // Step 2: Send welcome email independently (even if user creation partially failed, skip only on definite failure)
    if (!ownerWarning) {
      try {
        const logoHtml = logoUrl
          ? `<img src="${logoUrl}" alt="${company.name}" style="max-width: 120px; max-height: 60px; margin-bottom: 16px;" />`
          : ''

        await sendEmail({
          to: req.body.ownerEmail,
          subject: `Welcome to Forrof - You are now the owner of ${company.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${logoHtml}
              <h2>Welcome to Forrof!</h2>
              <p>Hi ${req.body.ownerName},</p>
              <p>A company has been created for you on the Forrof platform. You have been assigned as the <strong>owner/admin</strong> of <strong>${company.name}</strong>.</p>

              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Company:</strong> ${company.name}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${req.body.ownerEmail}</p>
                <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>

              <p><strong>Please change your password after your first login.</strong></p>

              <p>
                <a href="https://tracker.forrof.io" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Go to Forrof
                </a>
              </p>

              <p>If you have any questions, please contact your platform administrator.</p>
              <p>Best regards,<br>Forrof Team</p>
            </div>
          `,
          text: `Welcome to Forrof!\n\nHi ${req.body.ownerName},\n\nA company "${company.name}" has been created for you. You are the owner/admin.\n\nEmail: ${req.body.ownerEmail}\nTemporary Password: ${tempPassword}\n\nPlease change your password after your first login.\n\nGo to: https://tracker.forrof.io`,
        })
      } catch (emailErr) {
        console.error('[SUPER ADMIN] Failed to send welcome email:', emailErr)
        ownerWarning = 'Owner account created but welcome email could not be sent. Please share the credentials manually.'
      }
    }
  }

  await auditService.createAuditLog({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'company.create',
    targetType: 'company',
    targetId: company.id,
    metadata: { companyName: company.name, ownerEmail: req.body.ownerEmail || null },
    ipAddress: req.ip,
  })

  res.status(201).json({
    success: true,
    data: company,
    ...(ownerUser ? { owner: { id: ownerUser.id, email: ownerUser.email } } : {}),
    ...(ownerWarning ? { warning: ownerWarning } : {}),
  })
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
