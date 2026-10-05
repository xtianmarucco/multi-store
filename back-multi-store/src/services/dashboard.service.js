const repo = require('../repositories/dashboard.repository')

const getSummary = (groupId) => repo.getSummary(groupId)

module.exports = { getSummary }
