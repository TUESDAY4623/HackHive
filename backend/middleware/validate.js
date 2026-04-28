const { body, validationResult } = require('express-validator');

/**
 * Middleware: runs express-validator result check.
 * If there are validation errors, returns 400 with the first error message.
 * Attach this AFTER your validation chains in the route definition.
 */
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// ── Auth Validators ───────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name cannot exceed 60 characters'),

  body('handle')
    .trim()
    .notEmpty().withMessage('Handle is required')
    .isLength({ max: 30 }).withMessage('Handle cannot exceed 30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Handle can only contain lowercase letters, numbers and underscores'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  runValidation,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  runValidation,
];

// ── Project Validators ────────────────────────────────────────

const validateCreateProject = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Project description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),

  runValidation,
];

// ── Team Validators ───────────────────────────────────────────

const validateCreateTeam = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 60 }).withMessage('Team name cannot exceed 60 characters'),

  body('hackathonId')
    .trim()
    .notEmpty().withMessage('hackathonId is required')
    .isMongoId().withMessage('hackathonId must be a valid ID'),

  body('maxSize')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Max team size must be between 1 and 10'),

  runValidation,
];

// ── Conversation / Message Validators ────────────────────────

const validateSendMessage = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),

  runValidation,
];

const validateStartConversation = [
  body('recipientId')
    .trim()
    .notEmpty().withMessage('recipientId is required')
    .isMongoId().withMessage('recipientId must be a valid user ID'),

  runValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateProject,
  validateCreateTeam,
  validateSendMessage,
  validateStartConversation,
};
