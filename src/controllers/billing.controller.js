import catchAsync from '../utils/catchAsync.js'
import * as stripeService from '../services/stripe.service.js'
import * as subscriptionService from '../services/subscription.service.js'
import * as planService from '../services/plan.service.js'

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
