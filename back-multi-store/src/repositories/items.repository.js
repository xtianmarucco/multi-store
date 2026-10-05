const prisma = require('../lib/prisma')

const include = {
  location: { select: { id: true, name: true } },
  labels: { select: { id: true, name: true, color: true }, orderBy: { name: 'asc' } }
}

const format = (item) => item && {
  ...item,
  purchase_price: item.purchase_price != null ? Number(item.purchase_price) : null
}

const buildWhere = (groupId, { search, location_id, label_id, archived }) => ({
  group_id: groupId,
  is_archived: archived,
  ...(location_id && { location_id }),
  ...(label_id && { labels: { some: { id: label_id } } }),
  ...(search && {
    OR: ['name', 'description', 'manufacturer', 'model_number', 'serial_number'].map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  })
})

const findPaginated = async (groupId, filters, { page, pageSize }) => {
  const where = buildWhere(groupId, filters)
  const [rows, total] = await prisma.$transaction([
    prisma.items.findMany({
      where,
      include,
      orderBy: { updated_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.items.count({ where })
  ])
  return { rows: rows.map(format), total }
}

const findById = async (groupId, id) =>
  format(await prisma.items.findFirst({ where: { id, group_id: groupId }, include }))

const create = async ({ label_ids, ...data }) =>
  format(await prisma.items.create({
    data: { ...data, labels: { connect: label_ids.map(id => ({ id })) } },
    include
  }))

const update = async (id, { label_ids, ...data }) =>
  format(await prisma.items.update({
    where: { id },
    data: { ...data, labels: { set: label_ids.map(labelId => ({ id: labelId })) } },
    include
  }))

const remove = (id) =>
  prisma.items.delete({ where: { id } })

module.exports = { findPaginated, findById, create, update, remove }
