const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation rules
const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Project name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim(),
  handleValidationErrors
];

const projectIdValidation = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Invalid project ID'),
  handleValidationErrors
];

const addMemberValidation = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Invalid project ID'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  handleValidationErrors
];

// Task validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Task title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Status must be todo, in-progress, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid project ID'),
  body('assignedTo')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
  handleValidationErrors
];

const updateTaskValidation = [
  param('taskId')
    .isInt({ min: 1 })
    .withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Task title must be between 2 and 200 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Status must be todo, in-progress, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('assignedTo')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
  handleValidationErrors
];

const taskIdValidation = [
  param('taskId')
    .isInt({ min: 1 })
    .withMessage('Invalid task ID'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  createProjectValidation,
  projectIdValidation,
  addMemberValidation,
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation
};
