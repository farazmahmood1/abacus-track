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
import shiftsRoute from './shifts.route.js'
import leaveBalanceRoute from './leaveBalance.route.js'
import overtimeRoute from './overtime.route.js'
import deviationsRoute from './deviations.route.js'
import regularizationRoute from './regularization.route.js'
import timesheetSubmissionRoute from './timesheetSubmission.route.js'
import reportsRoute from './reports.route.js'
import reviewsRoute from './reviews.route.js'
import assetsRoute from './assets.route.js'
import standupsRoute from './standups.route.js'
import feedbackRoute from './feedback.route.js'
import chatRoute from './chat.route.js'
import calendarRoute from './calendar.route.js'
import locationRoute from './location.route.js'
import pomodoroRoute from './pomodoro.route.js'
import moodRoute from './mood.route.js'
import orgChartRoute from './orgChart.route.js'
import documentRoute from './document.route.js'
import compensationRoute from './compensation.route.js'
import expenseRoute from './expense.route.js'
import offboardingRoute from './offboarding.route.js'
import integrationRoute from './integration.route.js'
import scheduledReportRoute from './scheduledReport.route.js'
import milestoneRoute from './milestone.route.js'
import gamificationRoute from './gamification.route.js'
import wellnessRoute from './wellness.route.js'
import superAdminRoute from './superAdmin.route.js'
import billingRoute from './billing.route.js'
import ownerOnboardingRoute from './ownerOnboarding.route.js'
import employeesRoute from './employees.route.js'

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
  {
    path: '/shifts',
    route: shiftsRoute,
  },
  {
    path: '/leave-balances',
    route: leaveBalanceRoute,
  },
  {
    path: '/overtime',
    route: overtimeRoute,
  },
  {
    path: '/deviations',
    route: deviationsRoute,
  },
  {
    path: '/regularizations',
    route: regularizationRoute,
  },
  {
    path: '/timesheet-submissions',
    route: timesheetSubmissionRoute,
  },
  {
    path: '/reports',
    route: reportsRoute,
  },
  {
    path: '/reviews',
    route: reviewsRoute,
  },
  {
    path: '/assets',
    route: assetsRoute,
  },
  {
    path: '/standups',
    route: standupsRoute,
  },
  {
    path: '/feedback',
    route: feedbackRoute,
  },
  {
    path: '/chat',
    route: chatRoute,
  },
  {
    path: '/calendar',
    route: calendarRoute,
  },
  {
    path: '/location',
    route: locationRoute,
  },
  {
    path: '/pomodoro',
    route: pomodoroRoute,
  },
  {
    path: '/mood',
    route: moodRoute,
  },
  {
    path: '/org-chart',
    route: orgChartRoute,
  },
  {
    path: '/documents',
    route: documentRoute,
  },
  {
    path: '/compensation',
    route: compensationRoute,
  },
  {
    path: '/expenses',
    route: expenseRoute,
  },
  {
    path: '/offboarding',
    route: offboardingRoute,
  },
  {
    path: '/integrations',
    route: integrationRoute,
  },
  {
    path: '/scheduled-reports',
    route: scheduledReportRoute,
  },
  {
    path: '/milestones',
    route: milestoneRoute,
  },
  {
    path: '/gamification',
    route: gamificationRoute,
  },
  {
    path: '/wellness',
    route: wellnessRoute,
  },
  {
    path: '/super-admin',
    route: superAdminRoute,
  },
  {
    path: '/billing',
    route: billingRoute,
  },
  {
    path: '/owner-onboarding',
    route: ownerOnboardingRoute,
  },
  {
    path: '/employees',
    route: employeesRoute,
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
