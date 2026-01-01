import { auth } from '../lib/auth.js'

export const getSessionUser = async req => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) return null
    return session.user
  } catch (err) {
    console.error('Better-auth session error:', err)
    return null
  }
}
