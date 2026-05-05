const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken, isAdmin, isProjectAdmin } = require('../middleware/auth');
const { 
  createTaskValidation, 
  updateTaskValidation, 
  taskIdValidation 
} = require('../middleware/validation');

// Get dashboard stats
router.get('/dashboard/stats', authenticateToken, taskController.getDashboardStats);

// Get all tasks for current user
router.get('/', authenticateToken, taskController.getUserTasks);

// Create task (Project admin only)
router.post('/', authenticateToken, isProjectAdmin, createTaskValidation, taskController.createTask);

// Get single task
router.get('/:taskId', authenticateToken, taskIdValidation, taskController.getTaskById);

// Update task
router.put('/:taskId', authenticateToken, updateTaskValidation, taskController.updateTask);

// Delete task
router.delete('/:taskId', authenticateToken, taskIdValidation, taskController.deleteTask);

// Comment routes
router.post('/:taskId/comments', authenticateToken, taskController.addComment);
router.get('/:taskId/comments', authenticateToken, taskController.getComments);
router.delete('/:taskId/comments/:commentId', authenticateToken, taskController.deleteComment);

module.exports = router;
