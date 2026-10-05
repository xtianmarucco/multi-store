const prisma = require('../lib/prisma')

const publicFields = { id: true, full_name: true, email: true, role: true, group_id: true, created_at: true }

const findByEmail = (email) =>
  prisma.users.findUnique({ where: { email } })

const findAll = (groupId) =>
  prisma.users.findMany({ where: { group_id: groupId }, select: publicFields, orderBy: { full_name: 'asc' } })

const findById = (groupId, id) =>
  prisma.users.findFirst({ where: { id, group_id: groupId }, select: publicFields })

const countAdmins = (groupId) =>
  prisma.users.count({ where: { group_id: groupId, role: 'admin' } })

const create = (data) =>
  prisma.users.create({ data, select: publicFields })

// Registro: crea el grupo y su primer usuario (admin) en una sola transacción.
const createWithGroup = ({ group_name, ...user }) =>
  prisma.users.create({
    data: { ...user, role: 'admin', group: { create: { name: group_name } } },
    select: publicFields
  })

const update = (id, data) =>
  prisma.users.update({ where: { id }, data, select: publicFields })

const remove = (id) =>
  prisma.users.delete({ where: { id } })

module.exports = { findByEmail, findAll, findById, countAdmins, create, createWithGroup, update, remove }
