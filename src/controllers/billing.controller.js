import catchAsync from '../utils/catchAsync.js'
import * as stripeService from '../services/stripe.service.js'
import * as subscriptionService from '../services/subscription.service.js'
import * as planService from '../services/plan.service.js'
import * as companyService from '../services/company.service.js'
import prisma from '../config/prisma.js'

export const createCheckoutSession = catchAsync(async (req, res) => {
  const { planId, billingCycle, successUrl, cancelUrl } = req.body
  const companyId = req.user.companyId

  if (!companyId) {
    return res.status(400).json({ success: false, message: 'No company associated' })
  }

  const result = await stripeService.createCheckoutSession(
    companyId, planId, billingCycle, successUrl, cancelUrl
  )

  res.json({ success: true, data: result })
})

export const createPortalSession = catchAsync(async (req, res) => {
  const companyId = req.user.companyId
  const { returnUrl } = req.body

  if (!companyId) {
    return res.status(400).json({ success: false, message: 'No company associated' })
  }

  const result = await stripeService.createPortalSession(companyId, returnUrl)
  res.json({ success: true, data: result })
})

export const getSubscription = catchAsync(async (req, res) => {
  const companyId = req.user.companyId

  if (!companyId) {
    return res.json({ success: true, data: null })
  }

  const subscription = await subscriptionService.getCompanySubscription(companyId)
  res.json({ success: true, data: subscription })
})

export const getInvoices = catchAsync(async (req, res) => {
  const companyId = req.user.companyId

  if (!companyId) {
    return res.json({ success: true, data: [] })
  }

  const invoices = await subscriptionService.getInvoices(companyId)
  res.json({ success: true, data: invoices })
})

export const getPublicPlans = catchAsync(async (req, res) => {
  const plans = await planService.listPlans()
  res.json({ success: true, data: plans })
})

export const setupCompany = catchAsync(async (req, res) => {
  const userId = req.user.id

  // Prevent duplicate setup
  if (req.user.companyId) {
    return res.status(400).json({
      success: false,
      message: 'You already have a company associated with your account',
    })
  }

  const { companyName, domain, planSlug, billingCycle } = req.body

  if (!companyName || !planSlug) {
    return res.status(400).json({
      success: false,
      message: 'Company name and plan are required',
    })
  }

  // Look up plan by slug
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' })
  }

  // Create company
  const company = await companyService.createCompany({
    name: companyName,
    domain: domain || null,
    maxUsers: plan.maxUsers,
  })

  // Link user to company as admin
  await prisma.user.update({
    where: { id: userId },
    data: { companyId: company.id, role: 'admin' },
  })

  // Free plan: create subscription directly
  if (plan.price === 0 && !plan.isCustom) {
    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    })

    return res.json({
      success: true,
      data: { company, subscription, checkoutUrl: null },
    })
  }

  // Paid plan: create Stripe checkout session
  const cycle = billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY'
  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'
  const successUrl = `${frontendOrigin}/app?billing=success`
  const cancelUrl = `${frontendOrigin}/setup?billing=canceled`

  const result = await stripeService.createCheckoutSession(
    company.id, plan.id, cycle, successUrl, cancelUrl
  )

  res.json({
    success: true,
    data: { company, subscription: null, checkoutUrl: result.url },
  })
})

export const getCompany = catchAsync(async (req, res) => {
  const companyId = req.user.companyId

  if (!companyId) {
    return res.status(400).json({ success: false, message: 'No company associated' })
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  res.json({ success: true, data: company })
})

export const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    const result = await stripeService.handleWebhookEvent(req.body, signature)
    res.json(result)
  } catch (err) {
    console.error('Stripe webhook error:', err.message)
    res.status(400).json({ error: err.message })
  }
}
