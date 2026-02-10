import multer from 'multer'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Create upload directory if it doesn't exist
const uploadDir = path.join(os.tmpdir(), 'forrof-uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

// File filter for images only (for avatar/profile)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false)
  }
}

// File filter for documents (PDFs and images for prescriptions)
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error('Only PDF and image files are allowed (pdf, jpeg, png, gif, webp)'),
      false
    )
  }
}

// Image upload (for profile avatars)
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// Document upload (for prescriptions)
export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// File filter for general documents (document management)
const generalDocumentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'File type not allowed. Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, and images.'
      ),
      false
    )
  }
}

// General document upload (for document management)
export const uploadGeneralDocument = multer({
  storage,
  fileFilter: generalDocumentFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
})
