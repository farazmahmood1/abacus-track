import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'
import { sendEmail } from '../lib/mailer.js'
import cloudinary from '../lib/cloudinary.js'
import prisma from '../config/prisma.js'
import fs from 'fs'

export const reportIssue = async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { subject, category, description } = req.body

    if (!subject && !category && !description) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    await sendEmail({
      to: 'mohammadsaad925s4s@gmail.com',
      subject: `[REPORT] ${category} - ${subject}`,
      html: `
        <h2>New Issue Reported</h2>
        <p><strong>User:</strong> ${session.user.name} (${session.user.email})</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
      `,
    })

    return res.json({ message: 'Report sent successfully' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to send report' })
  }
}

export const uploadProfileImage = async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Delete existing image from Cloudinary if it exists
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    if (existingUser?.image) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = existingUser.image.split('/')
        const filename = urlParts[urlParts.length - 1]
        const publicId = `forrof-tracker/profiles/${filename.split('.')[0]}`

        await cloudinary.uploader.destroy(publicId)
      } catch (deleteErr) {
        console.warn('Failed to delete previous image from Cloudinary:', deleteErr)
      }
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'forrof-tracker/profiles',
      resource_type: 'auto',
      public_id: `user_${session.user.id}`,
      overwrite: true,
    })

    // Delete temporary file
    try {
      fs.unlinkSync(req.file.path)
    } catch (err) {
      console.warn('Failed to delete temporary file:', err)
    }

    // Update user image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })

    return res.json({
      message: 'Profile image uploaded successfully',
      user: updatedUser,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to upload image' })
  }
}
