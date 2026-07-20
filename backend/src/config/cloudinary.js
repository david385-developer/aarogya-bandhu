const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'duqnvfz2r',
  api_key: process.env.CLOUDINARY_API_KEY || '676618185327736',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ukVSYY9LGdhVSxUzopJ-QN-nAHs',
})

module.exports = { cloudinary }
