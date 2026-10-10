// Seed de desarrollo: grupo demo comercio con usuario, ubicaciones tipificadas,
// categorías, productos con SKU/EAN y stock distribuido.
// Login: demo@example.com / demo12345
// Solo aplica a DBs nuevas (si existe el usuario demo, no hace nada).
const bcrypt = require('bcrypt')
const prisma = require('../src/lib/prisma')

const DEMO_EMAIL = 'demo@example.com'

async function main() {
  if (await prisma.users.findUnique({ where: { email: DEMO_EMAIL } })) {
    console.log('El seed ya fue aplicado (existe el usuario demo).')
    return
  }

  const group = await prisma.groups.create({ data: { name: 'Comercio Demo' } })

  await prisma.users.create({
    data: {
      full_name: 'Usuario Demo',
      email: DEMO_EMAIL,
      password_hash: await bcrypt.hash('demo12345', 10),
      role: 'admin',
      group_id: group.id
    }
  })

  const deposito = await prisma.locations.create({
    data: { name: 'Depósito Central', type: 'warehouse', address: 'Av. Siempre Viva 123', group_id: group.id }
  })
  const local = await prisma.locations.create({
    data: { name: 'Local Centro', type: 'store', is_sale_point: true, address: 'Calle Principal 456', group_id: group.id }
  })

  const categoriaIds = {}
  for (const [name, color] of [
    ['Herramientas', '#f59e0b'],
    ['Bazar', '#10b981'],
    ['Electrónica', '#3b82f6'],
    ['Juguetes', '#ec4899'],
    ['Hogar', '#8b5cf6']
  ]) {
    const cat = await prisma.categories.create({ data: { name, color, group_id: group.id } })
    categoriaIds[name] = cat.id
  }

  // [sku, barcode, nombre, categoría, marca, costo, precio, iva, min_stock, stock depósito, stock local]
  const productos = [
    ['TAL-001', '7790001000011', 'Taladro percutor 650W', 'Herramientas', 'Bosch', 45000, 69900, 21, 2, 10, 4],
    ['DES-002', '7790001000028', 'Juego de destornilladores x6', 'Herramientas', 'Stanley', 8000, 12900, 21, 5, 20, 8],
    ['MIC-003', '7790001000035', 'Microondas 20L', 'Electrónica', 'Samsung', 95000, 149000, 21, 1, 5, 2],
    ['OLL-004', '7790001000042', 'Set de ollas antiadherentes x3', 'Hogar', 'Tramontina', 30000, 49900, 21, 3, 12, 6],
    ['JUG-005', '7790001000059', 'Peluche oso 40cm', 'Juguetes', 'Ditoys', 5000, 9900, 21, 5, 30, 10],
    ['BAZ-006', '7790001000066', 'Taza de cerámica 350ml', 'Bazar', null, 2500, 4900, 21, 5, 25, 12]
  ]

  for (const [sku, barcode, name, categoria, brand, costo, precio, iva, minStock, stockDepo, stockLocal] of productos) {
    const product = await prisma.products.create({
      data: {
        sku,
        barcode,
        name,
        category_id: categoriaIds[categoria],
        brand,
        unit: 'unit',
        cost_price: costo,
        sale_price: precio,
        tax_rate: iva,
        min_stock: minStock,
        group_id: group.id
      }
    })
    await prisma.stocks.create({
      data: { product_id: product.id, location_id: deposito.id, quantity: stockDepo, group_id: group.id }
    })
    await prisma.stocks.create({
      data: { product_id: product.id, location_id: local.id, quantity: stockLocal, group_id: group.id }
    })
  }

  console.log(`Seed aplicado. Login: ${DEMO_EMAIL} / demo12345`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
