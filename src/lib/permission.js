import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access'

export const statement = {
  ...defaultStatements,

  announcement: ['create', 'read', 'edit', 'delete'],
  leave: ['create', 'read', 'edit', 'delete'],
  settings: ['create', 'read', 'edit', 'delete'],
  department: ['create', 'read', 'edit', 'delete'],
  project: ['create', 'read', 'edit', 'delete'],
  dashboard: ['read'],
  onboarding: ['create', 'read', 'edit', 'delete'],
  notifications: ['create', 'read', 'edit', 'delete'],
}

export const ac = createAccessControl(statement)

export const employee = ac.newRole({
  announcement: ['read'],
  leave: ['create', 'read', 'edit', 'delete'],
  settings: ['read'],
  department: ['read'],
  project: ['read', 'edit'],
  dashboard: [],
  onboarding: ['create', 'read', 'edit', 'delete'],
})

export const admin = ac.newRole({
  announcement: ['create', 'read', 'edit', 'delete'],
  leave: ['create', 'read', 'edit', 'delete'],
  settings: ['create', 'read', 'edit', 'delete'],
  department: ['create', 'read', 'edit', 'delete'],
  project: ['create', 'read', 'edit', 'delete'],
  dashboard: ['read'],
  onboarding: ['create', 'read', 'edit', 'delete'],
  notifications: ['create', 'read', 'edit', 'delete'],
  ...adminAc.statements,
})
