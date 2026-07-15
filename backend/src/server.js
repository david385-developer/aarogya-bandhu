require('dotenv').config()

const { createApp } = require('./app')
const { connectDB } = require('./config/db')

const PORT = process.env.PORT || 4000

async function bootstrap() {
  await connectDB()
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Arogya Bandhu backend listening on port ${PORT}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start backend', error)
  process.exit(1)
})
