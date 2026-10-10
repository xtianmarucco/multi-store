const prisma = require('../lib/prisma')

const format = (variant) => variant && {
  ...variant,
  cost_price: variant.cost_price != null ? Number(variant.cost_price) : null,
  sale_price: variant.sale_price != null ? Number(variant.sale_price) : null
}

const findByProduct = async (groupId, productId) =>
  (await prisma.product_variants.findMany({
    where: { group_id: groupId, product_id: productId },
    orderBy: { sku: 'asc' }
  })).map(format)

const findById = async (groupId, id) =>
  format(await prisma.product_variants.findFirst({ where: { id, group_id: groupId } }))

const create = async (data) =>
  format(await prisma.product_variants.create({ data }))

const update = async (id, data) =>
  format(await prisma.product_variants.update({ where: { id }, data }))

const remove = (id) =>
  prisma.product_variants.delete({ where: { id } })

module.exports = { findByProduct, findById, create, update, remove }
