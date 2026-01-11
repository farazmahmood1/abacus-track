import { ENV } from '../config/env.js'
import express from 'express'

import docsRoute from './docs.route.js'
import userRoute from './user.route.js'
import announcementsRoute from './announcements.route.js'
import leavesRoute from './leaves.route.js'
import timerRoute from './timer.route.js'
import settingsRoute from './settings.route.js'
import attendanceRoute from './attendance.route.js'
import notificationsRoute from './notifications.route.js'
import employeeDashboardRoute from './employeeDashboard.route.js'
import departmentsRoute from './departments.route.js'
import projectsRoute from './projects.route.js'
import dashboardRoute from './dashboard.route.js'
import onboardingRoute from './onboarding.route.js'
import activityRoute from './activity.route.js'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/announcements',
    route: announcementsRoute,
  },
  {
    path: '/leaves',
    route: leavesRoute,
  },
  {
    path: '/timer',
    route: timerRoute,
  },
  {
    path: '/settings',
    route: settingsRoute,
  },
  {
    path: '/attendance',
    route: attendanceRoute,
  },
  {
    path: '/notifications',
    route: notificationsRoute,
  },
  {
    path: '/employee/dashboard',
    route: employeeDashboardRoute,
  },
  {
    path: '/departments',
    route: departmentsRoute,
  },
  {
    path: '/projects',
    route: projectsRoute,
  },
  {
    path: '/dashboard',
    route: dashboardRoute,
  },
  {
    path: '/onboarding',
    route: onboardingRoute,
  },
  {
    path: '/activity',
    route: activityRoute,
  },
]

const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
]

defaultRoutes.forEach(route => {
  router.use(route.path, route.route)
})

/* istanbul ignore next */
if (ENV.NODE_ENV === 'development') {
  devRoutes.forEach(route => {
    router.use(route.path, route.route)
  })
}

export default router
