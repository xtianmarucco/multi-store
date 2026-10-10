const prisma = require('../lib/prisma')

// Stock por ubicación: una fila por (producto, variante, ubicación).
// variant_id NULL = stock a nivel producto; con valor = stock de esa variante.

// Lectura de una fila puntual (vista de servicio).
const getStock = (groupId, productId, variantId, locationId) =>
  prisma.stocks.findFirst({
    where: { group_id: groupId, product_id: productId, variant_id: variantId, location_id: locationId }
  })

const findStocks = async (groupId, { product_id, location_id } = {}, { page, pageSize }) => {
  const where = {
    group_id: groupId,
    ...(product_id && { product_id }),
    ...(location_id && { location_id })
  }
  const [rows, total] = await prisma.$transaction([
    prisma.stocks.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.stocks.count({ where })
  ])
  return { rows, total }
}

const findMovements = async (groupId, { product_id, location_id } = {}, { page, pageSize }) => {
  const where = {
    group_id: groupId,
    ...(product_id && { product_id }),
    ...(location_id && { OR: [{ from_location_id: location_id }, { to_location_id: location_id }] })
  }
  const [rows, total] = await prisma.$transaction([
    prisma.stock_movements.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.stock_movements.count({ where })
  ])
  return { rows, total }
}

// Helper para el invariante de granularidad del servicio:
// cuenta variantes del producto en el grupo.
const countVariants = (groupId, productId) =>
  prisma.product_variants.count({ where: { group_id: groupId, product_id: productId } })

const upsertInTx = async (tx, { group_id, product_id, variant_id, location_id, quantity }) => {
  const existing = await tx.stocks.findFirst({
    where: { group_id, product_id, variant_id, location_id }
  })
  if (existing) {
    return tx.stocks.update({ where: { id: existing.id }, data: { quantity } })
  }
  return tx.stocks.create({ data: { group_id, product_id, variant_id, location_id, quantity } })
}

const movementInTx = (tx, data) => tx.stock_movements.create({ data })

// Fija stock absoluto + fila de movimiento, en una transacción.
const setStock = ({ group_id, product_id, variant_id, location_id, quantity, user_id, type, note }) =>
  prisma.$transaction(async (tx) => {
    const stock = await upsertInTx(tx, { group_id, product_id, variant_id, location_id, quantity })
    await movementInTx(tx, {
      group_id, product_id, variant_id, to_location_id: location_id,
      type, quantity, note: note ?? null, user_id
    })
    return stock
  })

// Suma (delta positivo o negativo) + fila de movimiento, en una transacción.
// Revalida stock suficiente dentro de la transacción (carrera check-then-act):
// el pre-chequeo del servicio puede quedar obsoleto ante outs concurrentes.
const addStock = ({ group_id, product_id, variant_id, location_id, quantity, user_id, type, note }) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.stocks.findFirst({
      where: { group_id, product_id, variant_id, location_id }
    })
    const available = existing?.quantity ?? 0
    if (available + quantity < 0) {
      const err = new Error('Stock insuficiente en la ubicación')
      err.code = 'VALIDATION_ERROR'
      err.status = 400
      throw err
    }
    const stock = existing
      ? await tx.stocks.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } })
      : await tx.stocks.create({ data: { group_id, product_id, variant_id, location_id, quantity } })
    await movementInTx(tx, {
      group_id, product_id, variant_id, to_location_id: location_id,
      type, quantity, note: note ?? null, user_id
    })
    return stock
  })

// Transferencia atómica: decremento en origen + incremento en destino +
// una fila de movimiento, todo dentro de un único prisma.$transaction.
// Revalida stock suficiente dentro de la transacción (carrera check-then-act).
const transfer = ({ group_id, product_id, variant_id, from_location_id, to_location_id, quantity, user_id, note }) =>
  prisma.$transaction(async (tx) => {
    const source = await tx.stocks.findFirst({
      where: { group_id, product_id, variant_id, location_id: from_location_id }
    })
    const available = source?.quantity ?? 0
    if (available < quantity) {
      const err = new Error('Stock insuficiente en la ubicación de origen')
      err.code = 'VALIDATION_ERROR'
      err.status = 400
      throw err
    }
    await tx.stocks.update({ where: { id: source.id }, data: { quantity: available - quantity } })
    const dest = await tx.stocks.findFirst({
      where: { group_id, product_id, variant_id, location_id: to_location_id }
    })
    if (dest) {
      await tx.stocks.update({ where: { id: dest.id }, data: { quantity: dest.quantity + quantity } })
    } else {
      await tx.stocks.create({
        data: { group_id, product_id, variant_id, location_id: to_location_id, quantity }
      })
    }
    await movementInTx(tx, {
      group_id, product_id, variant_id, from_location_id, to_location_id,
      type: 'transfer', quantity, note: note ?? null, user_id
    })
    return { product_id, variant_id, from_location_id, to_location_id, quantity }
  })

module.exports = {
  getStock, findStocks, findMovements, countVariants,
  setStock, addStock, transfer
}
