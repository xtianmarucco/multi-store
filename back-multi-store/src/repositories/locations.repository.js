const prisma = require('../lib/prisma')

const findAll = async (groupId, filter = {}) => {
  const where = { group_id: groupId }
  if (filter?.type) where.type = filter.type
  const rows = await prisma.locations.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { items: { where: { is_archived: false } } } } }
  })
  return rows.map(({ _count, ...location }) => ({ ...location, item_count: _count.items }))
}

const findById = (groupId, id) =>
  prisma.locations.findFirst({
    where: { id, group_id: groupId },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: 'asc' } }
    }
  })

const findParentId = async (id) => {
  const row = await prisma.locations.findUnique({ where: { id }, select: { parent_id: true } })
  return row?.parent_id ?? null
}

const create = (data) =>
  prisma.locations.create({ data })

const update = (id, data) =>
  prisma.locations.update({ where: { id }, data })

// Sububicaciones e items quedan sin ubicación (onDelete: SetNull).
const remove = (id) =>
  prisma.locations.delete({ where: { id } })

module.exports = { findAll, findById, findParentId, create, update, remove }
