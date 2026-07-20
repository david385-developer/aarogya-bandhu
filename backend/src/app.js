const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const { authRoutes } = require('./routes/authRoutes')
const { apiRoutes } = require('./routes/apiRoutes')
const { errorHandler } = require('./middleware/errorHandler')

function createApp() {
  const app = express()

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://aarogya-bandhu-ten.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean)

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true)
      } else {
        callback(new Error('CORS Policy: Origin not allowed'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  }))
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))

  app.get(['/', '/health'], (_req, res) => {
    res.json({ success: true, service: 'arogya-bandhu-backend', status: 'operational', version: '1.0.0' })
  })
  app.head(['/', '/health'], (_req, res) => {
    res.status(200).end()
  })

  app.use('/auth', authRoutes)
  app.use('/api/v1', apiRoutes)

  app.use(errorHandler)

  return app
}

module.exports = { createApp }
