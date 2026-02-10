import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

const SENSITIVE_FIELDS = ['accessToken', 'refreshToken']

function sanitize(integration) {
  if (!integration) return integration
  const copy = { ...integration }
  for (const field of SENSITIVE_FIELDS) {
    if (copy[field]) copy[field] = '••••••••'
  }
  return copy
}

export async function getIntegrations() {
  const integrations = await prisma.integration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { configurer: { select: { id: true, name: true, email: true } } },
  })
  return integrations.map(sanitize)
}

export async function getIntegration(id) {
  const integration = await prisma.integration.findUnique({
    where: { id },
    include: { configurer: { select: { id: true, name: true, email: true } } },
  })
  if (!integration) throw new ApiError(404, 'Integration not found')
  return sanitize(integration)
}

export async function configureSlack(userId, { webhookUrl, channelId, name }) {
  if (!webhookUrl) throw new ApiError(400, 'Webhook URL is required')

  const existing = await prisma.integration.findFirst({
    where: { type: 'SLACK', webhookUrl },
  })

  if (existing) {
    return prisma.integration.update({
      where: { id: existing.id },
      data: { webhookUrl, channelId, name: name || 'Slack', configuredBy: userId },
    })
  }

  return prisma.integration.create({
    data: {
      type: 'SLACK',
      name: name || 'Slack',
      webhookUrl,
      channelId,
      configuredBy: userId,
    },
  })
}

export async function configureTeams(userId, { webhookUrl, name }) {
  if (!webhookUrl) throw new ApiError(400, 'Webhook URL is required')

  const existing = await prisma.integration.findFirst({
    where: { type: 'TEAMS', webhookUrl },
  })

  if (existing) {
    return prisma.integration.update({
      where: { id: existing.id },
      data: { webhookUrl, name: name || 'Microsoft Teams', configuredBy: userId },
    })
  }

  return prisma.integration.create({
    data: {
      type: 'TEAMS',
      name: name || 'Microsoft Teams',
      webhookUrl,
      configuredBy: userId,
    },
  })
}

export async function configureGoogleCalendar(userId, { accessToken, refreshToken }) {
  if (!accessToken) throw new ApiError(400, 'Access token is required')

  const existing = await prisma.integration.findFirst({
    where: { type: 'GOOGLE_CALENDAR' },
  })

  if (existing) {
    return prisma.integration.update({
      where: { id: existing.id },
      data: { accessToken, refreshToken, configuredBy: userId },
    })
  }

  return prisma.integration.create({
    data: {
      type: 'GOOGLE_CALENDAR',
      name: 'Google Calendar',
      accessToken,
      refreshToken,
      configuredBy: userId,
    },
  })
}

export async function configureJira(userId, { domain, accessToken, projectMapping, name }) {
  if (!domain) throw new ApiError(400, 'Domain is required')
  if (!accessToken) throw new ApiError(400, 'API token is required')

  const existing = await prisma.integration.findFirst({
    where: { type: 'JIRA', domain },
  })

  if (existing) {
    return prisma.integration.update({
      where: { id: existing.id },
      data: {
        domain,
        accessToken,
        projectMapping: projectMapping ? JSON.stringify(projectMapping) : existing.projectMapping,
        name: name || 'Jira',
        configuredBy: userId,
      },
    })
  }

  return prisma.integration.create({
    data: {
      type: 'JIRA',
      name: name || 'Jira',
      domain,
      accessToken,
      projectMapping: projectMapping ? JSON.stringify(projectMapping) : null,
      configuredBy: userId,
    },
  })
}

export async function configureClickUp(userId, { accessToken, projectMapping, name }) {
  if (!accessToken) throw new ApiError(400, 'API token is required')

  const existing = await prisma.integration.findFirst({
    where: { type: 'CLICKUP' },
  })

  if (existing) {
    return prisma.integration.update({
      where: { id: existing.id },
      data: {
        accessToken,
        projectMapping: projectMapping ? JSON.stringify(projectMapping) : existing.projectMapping,
        name: name || 'ClickUp',
        configuredBy: userId,
      },
    })
  }

  return prisma.integration.create({
    data: {
      type: 'CLICKUP',
      name: name || 'ClickUp',
      accessToken,
      projectMapping: projectMapping ? JSON.stringify(projectMapping) : null,
      configuredBy: userId,
    },
  })
}

export async function deleteIntegration(id) {
  const integration = await prisma.integration.findUnique({ where: { id } })
  if (!integration) throw new ApiError(404, 'Integration not found')
  return prisma.integration.delete({ where: { id } })
}

export async function testWebhook(id) {
  const integration = await prisma.integration.findUnique({ where: { id } })
  if (!integration) throw new ApiError(404, 'Integration not found')

  if (integration.type === 'SLACK') {
    if (!integration.webhookUrl) throw new ApiError(400, 'No webhook URL configured')
    const response = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ':white_check_mark: Forrof Tracker integration test successful!',
      }),
    })
    if (!response.ok) {
      throw new ApiError(400, `Slack webhook test failed: ${response.statusText}`)
    }
    return { message: 'Slack test message sent successfully' }
  }

  if (integration.type === 'TEAMS') {
    if (!integration.webhookUrl) throw new ApiError(400, 'No webhook URL configured')
    const response = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0076D7',
        summary: 'Forrof Tracker Test',
        sections: [
          {
            activityTitle: 'Forrof Tracker Integration Test',
            activitySubtitle: 'This is a test message to verify your Teams webhook integration.',
            facts: [{ name: 'Status', value: 'Connected' }],
            markdown: true,
          },
        ],
      }),
    })
    if (!response.ok) {
      throw new ApiError(400, `Teams webhook test failed: ${response.statusText}`)
    }
    return { message: 'Teams test message sent successfully' }
  }

  throw new ApiError(400, `Test not supported for ${integration.type} integrations`)
}

export async function toggleActive(id) {
  const integration = await prisma.integration.findUnique({ where: { id } })
  if (!integration) throw new ApiError(404, 'Integration not found')

  return prisma.integration.update({
    where: { id },
    data: { isActive: !integration.isActive },
  })
}
