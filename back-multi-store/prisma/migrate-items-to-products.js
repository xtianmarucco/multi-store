// Migración de datos: items (pertenencias) -> products (catálogo) + stocks.
// Uso:
//   node prisma/migrate-items-to-products.js --dry-run   (solo imprime conteos, no escribe)
//   node prisma/migrate-items-to-products.js              (migra; aborta si ya hay products)
//   node prisma/migrate-items-to-products.js --force      (migra aunque haya products)
//
// Reglas:
// - Cada item genera un product con sku `MIG-<item.id>`, cost_price = sale_price =
//   purchase_price, active = !is_archived, y conserva sus labels.
// - Cada product migrado genera una fila de stocks con quantity = item.quantity en
//   item.location_id, o como fallback la primera ubicación warehouse del grupo,
//   o la primera ubicación del grupo si no hay warehouse.
// - Por seguridad NO se corre contra una DB que ya tenga products, salvo --force.
// - Esta migración es de una sola vía: no borra items (T7 los deja solo-lectura).
const prisma = require('../src/lib/prisma')

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')

function skuFor(itemId) {
  return `MIG-${itemId}`
}

async function resolveTargetLocation(groupId, preferredLocationId) {
  if (preferredLocationId) {
    const loc = await prisma.locations.findFirst({
      where: { id: preferredLocationId, group_id: groupId }
    })
    if (loc) return loc
  }
  const warehouse = await prisma.locations.findFirst({
    where: { group_id: groupId, type: 'warehouse' },
    orderBy: { id: 'asc' }
  })
  if (warehouse) return warehouse
  return prisma.locations.findFirst({
    where: { group_id: groupId },
    orderBy: { id: 'asc' }
  })
}

async function main() {
  const productCount = await prisma.products.count()
  if (productCount > 0 && !FORCE && !DRY_RUN) {
    console.error(
      `Abortado: la base ya tiene ${productCount} producto(s). ` +
      'Usá --force para migrar igual o --dry-run para inspeccionar.'
    )
    process.exitCode = 1
    return
  }

  const items = await prisma.items.findMany({
    include: { labels: { select: { id: true } } },
    orderBy: { id: 'asc' }
  })

  if (DRY_RUN) {
    const withLocation = items.filter((i) => i.location_id).length
    const archived = items.filter((i) => i.is_archived).length
    console.log(`[dry-run] items a migrar: ${items.length}`)
    console.log(`[dry-run] con ubicación propia: ${withLocation}`)
    console.log(`[dry-run] archivados (quedarían inactivos): ${archived}`)
    console.log(`[dry-run] products existentes: ${productCount}`)
    console.log('[dry-run] No se escribió nada.')
    return
  }

  let created = 0
  let skippedNoLocation = 0
  for (const item of items) {
    const location = await resolveTargetLocation(item.group_id, item.location_id)
    if (!location) {
      console.error(`Sin ubicación destino para item ${item.id} (grupo ${item.group_id}); omitido.`)
      skippedNoLocation += 1
      continue
    }
    await prisma.products.upsert({
      where: { group_id_sku: { group_id: item.group_id, sku: skuFor(item.id) } },
      update: {},
      create: {
        sku: skuFor(item.id),
        name: item.name,
        description: item.description,
        cost_price: item.purchase_price,
        sale_price: item.purchase_price,
        active: !item.is_archived,
        group_id: item.group_id,
        labels: item.labels.length
          ? { connect: item.labels.map((l) => ({ id: l.id })) }
          : undefined
      }
    })
    const product = await prisma.products.findUniqueOrThrow({
      where: { group_id_sku: { group_id: item.group_id, sku: skuFor(item.id) } }
    })
    // findFirst + create en lugar de upsert: variant_id NULL no es confiable
    // en cláusulas unique (Postgres trata cada NULL como distinto).
    const existing = await prisma.stocks.findFirst({
      where: {
        group_id: item.group_id,
        product_id: product.id,
        location_id: location.id,
        variant_id: null
      }
    })
    if (!existing) {
      await prisma.stocks.create({
        data: {
          product_id: product.id,
          variant_id: null,
          location_id: location.id,
          quantity: item.quantity,
          group_id: item.group_id
        }
      })
    }
    created += 1
  }

  console.log(`Migración completa: ${created} producto(s) creado(s), ${skippedNoLocation} omitido(s) sin ubicación.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
