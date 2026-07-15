const crypto = require('crypto')

function buildPassportPayload(patientProfile, passportToken, version = 1) {
  const payload = {
    pid: patientProfile.patientId,
    token: passportToken,
    version,
    checksum: crypto.createHash('sha256').update(`${patientProfile.patientId}:${passportToken}:${version}`).digest('hex'),
  }

  return payload
}

module.exports = { buildPassportPayload }
