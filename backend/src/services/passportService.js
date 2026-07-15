const Passport = require('../models/Passport')
const { buildPassportPayload } = require('../utils/passport')
const crypto = require('crypto')

async function ensurePassport(patientProfile) {
  let passport = await Passport.findOne({ patientId: patientProfile._id })

  if (!passport) {
    const passportToken = crypto.randomUUID()
    passport = await Passport.create({
      patientId: patientProfile._id,
      passportToken,
      qrPayload: buildPassportPayload(patientProfile, passportToken, 1),
      publicSummary: {},
      status: 'active',
      version: 1,
      lastSyncedAt: new Date(),
    })
  }

  return passport
}

module.exports = { ensurePassport }
