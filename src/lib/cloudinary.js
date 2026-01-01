import { v2 as cloudinary } from 'cloudinary'
import { ENV } from '../config/env.js'

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_NAME,
  api_key: ENV.CLOUDINARY_APIKEY,
  api_secret: ENV.CLOUDINARY_SECRET,
})

export default cloudinary
