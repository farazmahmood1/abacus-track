import { ENV } from '../config/env.js'

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Forrof Tracker API Documentation',
    version: '1.0.0',
    description:
      'This is the API documentation for Forrof Tracker, an employee leave management system.',
    contact: {
      name: 'Support Team',
      email: 'support@forrof.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.PORT}/api`,
      description: 'Development server',
    },
    {
      url: 'https://forrof-tracker-backend.vercel.app/',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Leaves',
      description: 'Leave request management endpoints',
    },
    {
      name: 'Announcements',
      description: 'Announcement management endpoints',
    },
    {
      name: 'User',
      description: 'User-related endpoints',
    },
  ],
}

export default swaggerDef
