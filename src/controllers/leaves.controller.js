import * as leavesService from '../services/leaves.service.js'
import ApiError from '../utils/ApiError.js'
import catchAsync from '../utils/catchAsync.js'
import { validate } from '../middlewares/validate.js'
import {
  createLeaveSchema,
  updateLeaveSchema,
  approveLeaveSchema,
  listLeaveSchema,
} from '../validations/leaves.js'
import cloudinary from '../lib/cloudinary.js'
import fs from 'fs'

export const listLeaves = catchAsync(async (req, res) => {
  const validatedQuery = await validate(listLeaveSchema, req.query)
  const result = await leavesService.list({ ...validatedQuery, companyId: req.user.companyId })
  res.json(result)
})

export const getLeave = catchAsync(async (req, res) => {
  const leave = await leavesService.getById(req.params.id)
  if (!leave) throw new ApiError(404, 'Leave not found')
  res.json(leave)
})

export const getMyLeaves = catchAsync(async (req, res) => {
  const user = req.user
  const { page, limit, status } = req.query

  const result = await leavesService.getByEmployeeId(user.id, {
    page,
    limit,
    status,
  })
  res.json(result)
})

export const createLeave = catchAsync(async (req, res) => {
  const user = req.user

  const validatedData = await validate(createLeaveSchema, req.body)

  let prescriptionUrl = null

  // Upload prescription to Cloudinary if provided
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'forrof-tracker/prescriptions',
        resource_type: 'auto',
      })
      prescriptionUrl = result.secure_url

      // Delete temporary file
      try {
        fs.unlinkSync(req.file.path)
      } catch (err) {
        console.warn('Failed to delete temporary file:', err)
      }
    } catch (err) {
      console.error('Failed to upload prescription:', err)
      throw new ApiError(500, 'Failed to upload prescription')
    }
  }

  const payload = {
    ...validatedData,
    employeeId: user.id,
    prescriptionUrl,
  }

  const leave = await leavesService.create(payload)
  res.status(201).json(leave)
})

export const updateLeave = catchAsync(async (req, res) => {
  const user = req.user
  const id = req.params.id

  const existing = await leavesService.getById(id)

  if (!existing) throw new ApiError(404, 'Leave not found')
  if (existing.employeeId !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden')
  }
  if (existing.status !== 'PENDING' && user.role !== 'admin') {
    throw new ApiError(400, 'Cannot update leave that is already approved or rejected')
  }

  const validatedData = await validate(updateLeaveSchema, req.body)

  let prescriptionUrl = validatedData.prescriptionUrl

  // Handle prescription file upload
  if (req.file) {
    try {
      // Delete old prescription from Cloudinary if it exists
      if (existing.prescriptionUrl) {
        try {
          const urlParts = existing.prescriptionUrl.split('/')
          const filename = urlParts[urlParts.length - 1]
          const publicId = `forrof-tracker/prescriptions/${filename.split('.')[0]}`
          await cloudinary.uploader.destroy(publicId)
        } catch (deleteErr) {
          console.warn('Failed to delete previous prescription:', deleteErr)
        }
      }

      // Upload new prescription
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'forrof-tracker/prescriptions',
        resource_type: 'auto',
      })
      prescriptionUrl = result.secure_url

      // Delete temporary file
      try {
        fs.unlinkSync(req.file.path)
      } catch (err) {
        console.warn('Failed to delete temporary file:', err)
      }
    } catch (err) {
      console.error('Failed to upload prescription:', err)
      throw new ApiError(500, 'Failed to upload prescription')
    }
  }

  const payload = {
    ...validatedData,
    prescriptionUrl,
  }

  const updated = await leavesService.update(id, payload)
  res.json(updated)
})

export const approveLeave = catchAsync(async (req, res) => {
  const user = req.user
  const id = req.params.id

  const existing = await leavesService.getById(id)

  if (!existing) throw new ApiError(404, 'Leave not found')
  if (user.role !== 'admin') throw new ApiError(403, 'Only admins can approve leaves')

  const validatedData = await validate(approveLeaveSchema, req.body)
  const approved = await leavesService.approve(id, validatedData, user.id)
  res.json(approved)
})

export const deleteLeave = catchAsync(async (req, res) => {
  const user = req.user
  const id = req.params.id

  const existing = await leavesService.getById(id)

  if (!existing) throw new ApiError(404, 'Leave not found')
  if (existing.employeeId !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden')
  }

  await leavesService.remove(id)
  res.status(204).end()
})

export const getLeaveStats = catchAsync(async (req, res) => {
  const user = req.user
  const stats = await leavesService.getStats(user.id)
  res.json(stats)
})

export const getAdminLeaveStats = catchAsync(async (req, res) => {
  const stats = await leavesService.getAdminStats(req.user.companyId)
  res.json(stats)
})

export default {
  listLeaves,
  getLeave,
  getMyLeaves,
  createLeave,
  updateLeave,
  approveLeave,
  deleteLeave,
  getLeaveStats,
  getAdminLeaveStats,
}
