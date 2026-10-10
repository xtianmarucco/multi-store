const prisma = require('../lib/prisma')

const findAll = async (groupId) => {
  const rows = await prisma.categories.findMany({
    where: { group_id: groupId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  })
  return rows.map(({ _count, ...category }) => ({ ...category, product_count: _count.products }))
}

const findById = (groupId, id) =>
  prisma.categories.findFirst({
    where: { id, group_id: groupId },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: 'asc' } }
    }
  })

const findParentId = async (id) => {
  const row = await prisma.categories.findUnique({ where: { id }, select: { parent_id: true } })
  return row?.parent_id ?? null
}

const countByIds = (groupId, ids) =>
  prisma.categories.count({ where: { id: { in: ids }, group_id: groupId } })

const create = (data) =>
  prisma.categories.create({ data })

const update = (id, data) =>
  prisma.categories.update({ where: { id }, data })

// Hijos y productos quedan sin categoría (onDelete: SetNull).
const remove = (id) =>
  prisma.categories.delete({ where: { id } })

module.exports = { findAll, findById, findParentId, countByIds, create, update, remove }
