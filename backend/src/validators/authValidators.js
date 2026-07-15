const { body } = require('express-validator')
const { ROLES } = require('../constants/roles')

const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(Object.values(ROLES)).withMessage('Invalid role'),
]

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
]

module.exports = { registerValidator, loginValidator, refreshValidator }
