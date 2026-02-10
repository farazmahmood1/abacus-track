import * as integrationService from '../services/integration.service.js'
import catchAsync from '../utils/catchAsync.js'

const getAll = catchAsync(async (req, res) => {
  const data = await integrationService.getIntegrations()
  res.json({ success: true, data })
})

const getOne = catchAsync(async (req, res) => {
  const data = await integrationService.getIntegration(req.params.id)
  res.json({ success: true, data })
})

const configureSlack = catchAsync(async (req, res) => {
  const data = await integrationService.configureSlack(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const configureTeams = catchAsync(async (req, res) => {
  const data = await integrationService.configureTeams(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const configureGoogleCalendar = catchAsync(async (req, res) => {
  const data = await integrationService.configureGoogleCalendar(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const configureJira = catchAsync(async (req, res) => {
  const data = await integrationService.configureJira(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const configureClickUp = catchAsync(async (req, res) => {
  const data = await integrationService.configureClickUp(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await integrationService.deleteIntegration(req.params.id)
  res.json({ success: true, data: { message: 'Integration deleted' } })
})

const test = catchAsync(async (req, res) => {
  const data = await integrationService.testWebhook(req.params.id)
  res.json({ success: true, data })
})

const toggle = catchAsync(async (req, res) => {
  const data = await integrationService.toggleActive(req.params.id)
  res.json({ success: true, data })
})

export default { getAll, getOne, configureSlack, configureTeams, configureGoogleCalendar, configureJira, configureClickUp, remove, test, toggle }
