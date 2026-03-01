import { betterAuth, ENV } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin as adminPlugin } from 'better-auth/plugins'
import prisma from '../config/prisma.js'
import { loadEmailTemplate } from '../utils/loadTemplate.js'
import { sendEmail } from './mailer.js'
import { ac, admin, employee, superAdmin } from './permission.js'
import { generateUniqueIdForDatabase } from '../utils/generateUniqueId.js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (userData, ctx) => {
          try {
            const isAdminCreated = !ctx.request.url.includes('/auth/sign-up')

            // Generate unique ID if not already present
            const uniqueId = await generateUniqueIdForDatabase(prisma)

            await prisma.user.update({
              where: { id: userData.id },
              data: {
                uniqueId,
                ...(isAdminCreated && {
                  emailVerified: true,
                  isPasswordChanged: false,
                }),
              },
            })

            // Extract password from custom header
            let password = 'forrof1234'
            try {
              const headerPassword = ctx.request.headers.get('x-temp-password')
              if (headerPassword) {
                password = headerPassword
              } else {
                // Fallback: try parsed body/input
                password = ctx.body?.password || ctx.input?.password || password
              }
            } catch (e) {
              console.warn(`[AUTH HOOK] Error extracting password: ${e.message}`)
            }

            if (isAdminCreated) {
              await sendEmail({
                to: userData.email,
                subject: 'Welcome to Forrof - Your Account is Ready',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Forrof! 👋</h2>
                    <p>Hi ${userData.name},</p>
                    <p>Your account has been created by an administrator. Here are your login details:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p><strong>Email:</strong> ${userData.email}</p>
                      <p><strong>Temporary Password:</strong> ${password}</p>
                    </div>
                    
                    <p><strong>Please change your password after your first login.</strong></p>
                    
                    <p>
                      <a href="https://tracker.forrof.io" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Go to Forrof
                      </a>
                    </p>
                    
                    <p>If you have any questions, please contact the administrator.</p>
                    <p>Best regards,<br>Forrof Team</p>
                  </div>
                `,
                text: `Welcome to Forrof!\n\nHi ${userData.name},\n\nYour account has been created.\n\nEmail: ${userData.email}\nTemporary Password: ${password}\n\nPlease change your password after your first login.\n\nGo to: https://tracker.forrof.io`,
              })
              console.log('[AUTH HOOK] Welcome email sent to:', userData.email)
            }
          } catch (error) {
            console.error('Error in user creation hook:', error)
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      departmentId: { enabled: true, required: false },
      isPasswordChanged: { enabled: true },
      salary: { enabled: true, required: false },
      phone: { enabled: true, required: false },
      address: { enabled: true, required: false },
      isProfileCompleted: { enabled: true, required: false },
      uniqueId: { enabled: true, required: false },
      githubUrl: { enabled: true, required: false },
      linkedinUrl: { enabled: true, required: false },
      companyId: { enabled: true, required: false },
    },
    changeEmail: { enabled: true },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Click the link to reset your password: ${url}`,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token }, request) => {
      const url = new URL(request.url)

      const callbackURL =
        url.searchParams.get('callbackURL') ||
        (ENV.NODE_ENV === 'development'
          ? 'http://localhost:5173/verify-success'
          : 'https://tracker.forrof.io/verify-success')

      const verificationLink = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(
        callbackURL
      )}`

      const htmlTemplate = loadEmailTemplate('email-verification.html', {
        VERIFICATION_LINK: verificationLink,
      })

      await sendEmail({
        to: user.email,
        subject: 'Verify your email — Forrof',
        text: `Click to verify: ${verificationLink}`,
        html: htmlTemplate,
      })
    },

    sendOnSignUp: true,
    sendOnSignIn: false,

    autoSignInAfterVerification: true,
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        super_admin: superAdmin,
        admin,
        employee,
      },
      defaultRole: 'employee',
      adminRoles: ['admin', 'super_admin'],
    }),
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
    },
    disableCSRFCheck: true,
  },
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
    'https://forrof-tracker.vercel.app',
    'https://forrof-tracker-backend.vercel.app',
    'https://tracker.forrof.io',
    'https://www.tracker.forrof.io',
  ],

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
})
