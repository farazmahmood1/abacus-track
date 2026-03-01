import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function listCompanies({ page = 1, limit = 20, search, status }) {
  const where = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getCompanyById(id) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      },
      featureOverrides: true,
      _count: {
        select: {
          users: true,
          departments: true,
          projects: true,
        },
      },
    },
  })
  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

export async function createCompany(data) {
  // Generate slug from name
  let slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Check slug uniqueness
  const existing = await prisma.company.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  return prisma.company.create({
    data: {
      name: data.name,
      slug,
      domain: data.domain || null,
      logo: data.logo || null,
      colorPrimary: data.colorPrimary || '#4f46e5',
      colorSecondary: data.colorSecondary || null,
      maxUsers: data.maxUsers || 5,
    },
  })
}

export async function updateCompany(id, data) {
  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) throw new ApiError(404, 'Company not found')

  return prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      domain: data.domain,
      logo: data.logo,
      colorPrimary: data.colorPrimary,
      colorSecondary: data.colorSecondary,
      maxUsers: data.maxUsers,
    },
  })
}

export async function updateCompanyStatus(id, status) {
  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) throw new ApiError(404, 'Company not found')

  return prisma.company.update({
    where: { id },
    data: { status },
  })
}

export async function updateCompanyBranding(id, { logo, colorPrimary, colorSecondary }) {
  return prisma.company.update({
    where: { id },
    data: { logo, colorPrimary, colorSecondary },
  })
}

export async function deleteCompany(id) {
  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) throw new ApiError(404, 'Company not found')

  return prisma.company.update({
    where: { id },
    data: { status: 'DEACTIVATED' },
  })
}

export async function getCompanyFeatures(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          plan: { include: { features: true } },
        },
      },
      featureOverrides: true,
    },
  })

  if (!company) throw new ApiError(404, 'Company not found')

  const planFeatures = company.subscriptions[0]?.plan?.features || []
  const overrides = company.featureOverrides || []

  // Merge: overrides take priority over plan features
  const featureMap = new Map()
  for (const f of planFeatures) {
    featureMap.set(f.featureKey, { key: f.featureKey, name: f.featureName, enabled: f.enabled, limit: f.limit, source: 'plan' })
  }
  for (const o of overrides) {
    featureMap.set(o.featureKey, { key: o.featureKey, name: o.featureKey, enabled: o.enabled, limit: o.limit, source: 'override' })
  }

  return Array.from(featureMap.values())
}

export async function setFeatureOverride(companyId, featureKey, { enabled, limit, reason }, actorId) {
  return prisma.companyFeatureOverride.upsert({
    where: { companyId_featureKey: { companyId, featureKey } },
    create: { companyId, featureKey, enabled, limit, reason, overriddenBy: actorId },
    update: { enabled, limit, reason, overriddenBy: actorId },
  })
}

export async function removeFeatureOverride(companyId, featureKey) {
  return prisma.companyFeatureOverride.delete({
    where: { companyId_featureKey: { companyId, featureKey } },
  })
}
