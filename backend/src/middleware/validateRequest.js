const { validationResult } = require('express-validator')
const { AppError } = require('../utils/appError')

function validateRequest(req, _res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return next(new AppError(result.array().map((e) => e.msg).join(', '), 422))
  }
  next()
}

module.exports = { validateRequest }
