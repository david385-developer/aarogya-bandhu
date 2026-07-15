const HealthEvent = require('../models/HealthEvent')

async function createHealthEvent(payload) {
  return HealthEvent.create(payload)
}

module.exports = { createHealthEvent }
