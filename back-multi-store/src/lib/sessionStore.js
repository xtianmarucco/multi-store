const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const store = new pgSession({
  pool,
  tableName: 'session',
  createTableIfMissing: true
})

module.exports = store
