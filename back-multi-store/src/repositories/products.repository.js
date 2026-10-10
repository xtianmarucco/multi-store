const prisma = require('../lib/prisma')

const include = {
  category: { select: { id: true, name: true } },
  labels: { select: { id: true, name: true, color: true }, orderBy: { name: 'asc' } }
}

const format = (product) => product && {
  ...product,
  cost_price: product.cost_price != null ? Number(product.cost_price) : null,
  sale_price: product.sale_price != null ? Number(product.sale_price) : null,
  tax_rate: product.tax_rate != null ? Number(product.tax_rate) : null
}

const buildWhere = (groupId, { search, category_id, label_id, active }) => ({
  group_id: groupId,
  ...(active !== undefined && { active }),
  ...(category_id && { category_id }),
  ...(label_id && { labels: { some: { id: label_id } } }),
  ...(search && {
    OR: ['name', 'description', 'brand', 'sku', 'barcode'].map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  })
})

const findPaginated = async (groupId, filters, { page, pageSize }) => {
  const where = buildWhere(groupId, filters)
  const [rows, total] = await prisma.$transaction([
    prisma.products.findMany({
      where,
      include,
      orderBy: { updated_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.products.count({ where })
  ])
  return { rows: rows.map(format), total }
}

const findById = async (groupId, id) =>
  format(await prisma.products.findFirst({ where: { id, group_id: groupId }, include }))

const create = async ({ label_ids, category_id, ...data }) =>
  format(await prisma.products.create({
    data: {
      ...data,
      category: category_id ? { connect: { id: category_id } } : undefined,
      labels: { connect: label_ids.map(id => ({ id })) }
    },
    include
  }))

const update = async (id, { label_ids, category_id, ...data }) =>
  format(await prisma.products.update({
    where: { id },
    data: {
      ...data,
      category: category_id ? { connect: { id: category_id } } : { disconnect: true },
      labels: { set: label_ids.map(labelId => ({ id: labelId })) }
    },
    include
  }))

const remove = (id) =>
  prisma.products.delete({ where: { id } })

module.exports = { findPaginated, findById, create, update, remove }
