const prisma = require('../lib/prisma')

const getSummary = async (groupId) => {
  const [total_items, total_locations, total_labels, [value]] = await Promise.all([
    prisma.items.count({ where: { group_id: groupId, is_archived: false } }),
    prisma.locations.count({ where: { group_id: groupId } }),
    prisma.labels.count({ where: { group_id: groupId } }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(purchase_price * quantity), 0) AS total
      FROM items
      WHERE group_id = ${groupId} AND is_archived = false
    `
  ])
  return { total_items, total_locations, total_labels, total_value: Number(value.total) }
}

module.exports = { getSummary }
