// Seed de desarrollo: grupo demo con usuario, ubicaciones, etiquetas e items.
// Login: demo@example.com / demo12345
const bcrypt = require('bcrypt')
const prisma = require('../src/lib/prisma')

const DEMO_EMAIL = 'demo@example.com'

async function main() {
  if (await prisma.users.findUnique({ where: { email: DEMO_EMAIL } })) {
    console.log('El seed ya fue aplicado (existe el usuario demo).')
    return
  }

  const group = await prisma.groups.create({ data: { name: 'Demo' } })

  await prisma.users.create({
    data: {
      full_name: 'Usuario Demo',
      email: DEMO_EMAIL,
      password_hash: await bcrypt.hash('demo12345', 10),
      role: 'admin',
      group_id: group.id
    }
  })

  const casa = await prisma.locations.create({ data: { name: 'Casa', group_id: group.id } })
  const garaje = await prisma.locations.create({ data: { name: 'Garaje', parent_id: casa.id, group_id: group.id } })
  const cocina = await prisma.locations.create({ data: { name: 'Cocina', parent_id: casa.id, group_id: group.id } })

  const herramientas = await prisma.labels.create({ data: { name: 'Herramientas', color: '#f59e0b', group_id: group.id } })
  const electro = await prisma.labels.create({ data: { name: 'Electrodomésticos', color: '#3b82f6', group_id: group.id } })

  await prisma.items.create({
    data: {
      name: 'Taladro percutor',
      manufacturer: 'Bosch',
      model_number: 'GSB 13 RE',
      purchase_price: 89.9,
      purchase_date: new Date('2024-03-10'),
      location_id: garaje.id,
      group_id: group.id,
      labels: { connect: [{ id: herramientas.id }] }
    }
  })
  await prisma.items.create({
    data: {
      name: 'Juego de destornilladores',
      quantity: 2,
      purchase_price: 15,
      location_id: garaje.id,
      group_id: group.id,
      labels: { connect: [{ id: herramientas.id }] }
    }
  })
  await prisma.items.create({
    data: {
      name: 'Microondas',
      manufacturer: 'Samsung',
      purchase_price: 120,
      warranty_expires: new Date('2027-01-31'),
      location_id: cocina.id,
      group_id: group.id,
      labels: { connect: [{ id: electro.id }] }
    }
  })

  console.log(`Seed aplicado. Login: ${DEMO_EMAIL} / demo12345`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
