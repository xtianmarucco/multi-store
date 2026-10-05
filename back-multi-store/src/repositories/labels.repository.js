const prisma = require('../lib/prisma')

const findAll = async (groupId) => {
  const rows = await prisma.labels.findMany({
    where: { group_id: groupId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { items: { where: { is_archived: false } } } } }
  })
  return rows.map(({ _count, ...label }) => ({ ...label, item_count: _count.items }))
}

const findById = (groupId, id) =>
  prisma.labels.findFirst({ where: { id, group_id: groupId } })

const countByIds = (groupId, ids) =>
  prisma.labels.count({ where: { id: { in: ids }, group_id: groupId } })

const create = (data) =>
  prisma.labels.create({ data })

const update = (id, data) =>
  prisma.labels.update({ where: { id }, data })

const remove = (id) =>
  prisma.labels.delete({ where: { id } })

module.exports = { findAll, findById, countByIds, create, update, remove }
