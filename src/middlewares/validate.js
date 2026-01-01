import ApiError from '../utils/ApiError.js'

export const validate = async (schema, data) => {
  try {
    return schema.parse(data)
  } catch (err) {
    console.error('Validation error:', err.errors)
    throw new ApiError(400, err.errors?.[0]?.message || 'Invalid request data')
  }
}

export default validate
