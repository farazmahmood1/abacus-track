import * as calendarService from '../services/calendar.service.js'
import catchAsync from '../utils/catchAsync.js'

const listHolidays = catchAsync(async (req, res) => {
  const { year } = req.query
  const data = await calendarService.listHolidays({ year: year ? parseInt(year) : undefined })
  res.json({ success: true, data })
})

const createHoliday = catchAsync(async (req, res) => {
  const data = await calendarService.createHoliday(req.body)
  res.status(201).json({ success: true, data })
})

const updateHoliday = catchAsync(async (req, res) => {
  const data = await calendarService.updateHoliday(req.params.id, req.body)
  res.json({ success: true, data })
})

const deleteHoliday = catchAsync(async (req, res) => {
  await calendarService.deleteHoliday(req.params.id)
  res.json({ success: true, message: 'Holiday deleted' })
})

const getCalendarData = catchAsync(async (req, res) => {
  const { year, month } = req.query
  const data = await calendarService.getCalendarData({
    year: parseInt(year || new Date().getFullYear()),
    month: parseInt(month || new Date().getMonth() + 1),
  })
  res.json({ success: true, data })
})

export default { listHolidays, createHoliday, updateHoliday, deleteHoliday, getCalendarData }
