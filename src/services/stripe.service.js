import Stripe from 'stripe'
import { ENV } from '../config/env.js'
import prisma from '../config/prisma.js'

const stripe = ENV.STRIPE_SECRET_KEY
  ? new Stripe(ENV.STRIPE_SECRET_KEY)
  : null

function ensureStripe() {
  if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.')
  return stripe
}

export async function createCheckoutSession(companyId, planId, billingCycle, successUrl, cancelUrl) {
  const s = ensureStripe()

  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) throw new Error('Company not found')

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error('Plan not found')

  const priceId = billingCycle === 'YEARLY' ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId
  if (!priceId) throw new Error(`No Stripe price configured for plan "${plan.name}" (${billingCycle})`)

  // Get or create Stripe customer
  let customerId = company.stripeCustomerId
  if (!customerId) {
    const customer = await s.customers.create({
      name: company.name,
      metadata: { companyId: company.id, companySlug: company.slug },
    })
    customerId = customer.id
    await prisma.company.update({
      where: { id: companyId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${ENV.BETTER_AUTH_URL}/app/settings?billing=success`,
    cancel_url: cancelUrl || `${ENV.BETTER_AUTH_URL}/app/settings?billing=canceled`,
    metadata: { companyId, planId, billingCycle },
    subscription_data: {
      metadata: { companyId, planId },
    },
  })

  return { url: session.url, sessionId: session.id }
}

export async function createPortalSession(companyId, returnUrl) {
  const s = ensureStripe()

  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company?.stripeCustomerId) throw new Error('No Stripe customer for this company')

  const session = await s.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: returnUrl || `${ENV.BETTER_AUTH_URL}/app/settings`,
  })

  return { url: session.url }
}

export async function handleWebhookEvent(rawBody, signature) {
  const s = ensureStripe()

  const event = s.webhooks.constructEvent(rawBody, signature, ENV.STRIPE_WEBHOOK_SECRET)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { companyId, planId, billingCycle } = session.metadata || {}
      if (companyId && planId && session.subscription) {
        await activateSubscription(companyId, planId, session.subscription, billingCycle)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      await syncSubscription(sub)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await cancelSubscription(sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }

    default:
      break
  }

  return { received: true }
}

async function activateSubscription(companyId, planId, stripeSubscriptionId, billingCycle) {
  const s = ensureStripe()
  const stripeSub = await s.subscriptions.retrieve(stripeSubscriptionId)

  // Deactivate existing subscriptions
  await prisma.subscription.updateMany({
    where: { companyId, status: 'ACTIVE' },
    data: { status: 'CANCELED' },
  })

  await prisma.subscription.create({
    data: {
      companyId,
      planId,
      stripeSubscriptionId,
      stripeCustomerId: stripeSub.customer,
      stripePriceId: stripeSub.items.data[0]?.price?.id,
      status: 'ACTIVE',
      billingCycle: billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    },
  })

  // Update company plan limits
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (plan) {
    await prisma.company.update({
      where: { id: companyId },
      data: { maxUsers: plan.maxUsers, stripeSubscriptionId },
    })
  }
}

async function syncSubscription(stripeSub) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  })
  if (!existing) return

  const statusMap = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSub.id },
    data: {
      status: statusMap[stripeSub.status] || 'ACTIVE',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
    },
  })
}

async function cancelSubscription(stripeSubscriptionId) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}
