const prisma = require('../lib/prisma')

const format = (row) => row && { ...row, price: Number(row.price) }

const findAll = (groupId) =>
  prisma.price_lists.findMany({ where: { group_id: groupId }, orderBy: { name: 'asc' } })

const findById = (groupId, id) =>
  prisma.price_lists.findFirst({ where: { id, group_id: groupId } })

const create = (data) =>
  prisma.price_lists.create({ data })

const update = (id, data) =>
  prisma.price_lists.update({ where: { id }, data })

const remove = (id) =>
  prisma.price_lists.delete({ where: { id } })

const findPrices = async (priceListId) =>
  (await prisma.product_prices.findMany({
    where: { price_list_id: priceListId },
    orderBy: { id: 'asc' }
  })).map(format)

// variant_id null se busca con equals: null (findFirst no distingue undefined/null).
const findPrice = async (priceListId, productId, variantId = null) =>
  format(await prisma.product_prices.findFirst({
    where: { price_list_id: priceListId, product_id: productId, variant_id: variantId }
  }))

const findPriceById = async (priceListId, id) =>
  format(await prisma.product_prices.findFirst({ where: { id, price_list_id: priceListId } }))

const createPrice = async (data) =>
  format(await prisma.product_prices.create({ data }))

const updatePrice = async (id, data) =>
  format(await prisma.product_prices.update({ where: { id }, data }))

const removePrice = (id) =>
  prisma.product_prices.delete({ where: { id } })

module.exports = {
  findAll, findById, create, update, remove,
  findPrices, findPrice, findPriceById, createPrice, updatePrice, removePrice
}
