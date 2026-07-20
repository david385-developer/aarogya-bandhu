const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const { authRoutes } = require('./routes/authRoutes')
const { apiRoutes } = require('./routes/apiRoutes')
const { errorHandler } = require('./middleware/errorHandler')

function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'arogya-bandhu-backend' })
  })

  app.use('/auth', authRoutes)
  app.use('/api/v1', apiRoutes)

  app.use(errorHandler)

  return app
}

module.exports = { createApp }
