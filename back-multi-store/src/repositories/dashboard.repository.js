const prisma = require('../lib/prisma')

const getSummary = async (groupId) => {
  const [
    total_items, total_locations, total_labels, [value],
    total_products, total_categories,
    [capital], [warehouse], [store], [low]
  ] = await Promise.all([
    prisma.items.count({ where: { group_id: groupId, is_archived: false } }),
    prisma.locations.count({ where: { group_id: groupId } }),
    prisma.labels.count({ where: { group_id: groupId } }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(purchase_price * quantity), 0) AS total
      FROM items
      WHERE group_id = ${groupId} AND is_archived = false
    `,
    prisma.products.count({ where: { group_id: groupId, active: true } }),
    prisma.categories.count({ where: { group_id: groupId } }),
    // Capital valorizado a COSTO (no precio de venta): variante si hay, si no producto.
    prisma.$queryRaw`
      SELECT COALESCE(SUM(s.quantity * COALESCE(v.cost_price, p.cost_price)), 0) AS total
      FROM stocks s
      JOIN products p ON p.id = s.product_id
      LEFT JOIN product_variants v ON v.id = s.variant_id
      WHERE s.group_id = ${groupId}
    `,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(s.quantity * COALESCE(v.cost_price, p.cost_price)), 0) AS total
      FROM stocks s
      JOIN products p ON p.id = s.product_id
      LEFT JOIN product_variants v ON v.id = s.variant_id
      JOIN locations l ON l.id = s.location_id
      WHERE s.group_id = ${groupId} AND l.type = 'warehouse'
    `,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(s.quantity * COALESCE(v.cost_price, p.cost_price)), 0) AS total
      FROM stocks s
      JOIN products p ON p.id = s.product_id
      LEFT JOIN product_variants v ON v.id = s.variant_id
      JOIN locations l ON l.id = s.location_id
      WHERE s.group_id = ${groupId} AND l.type = 'store'
    `,
    // Filas de stock bajo su mínimo (mínimo de variante si hay, si no de producto).
    prisma.$queryRaw`
      SELECT COUNT(*) AS total
      FROM stocks s
      JOIN products p ON p.id = s.product_id
      LEFT JOIN product_variants v ON v.id = s.variant_id
      WHERE s.group_id = ${groupId}
        AND s.quantity < COALESCE(v.min_stock, p.min_stock)
    `
  ])
  return {
    total_items,
    total_locations,
    total_labels,
    total_value: Number(value.total),
    total_products,
    total_categories,
    capital_total: Number(capital.total),
    capital_warehouse: Number(warehouse.total),
    capital_store: Number(store.total),
    low_stock_count: Number(low.total)
  }
}

module.exports = { getSummary }
