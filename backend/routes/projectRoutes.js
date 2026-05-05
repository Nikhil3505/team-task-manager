const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, isAdmin, isProjectAdmin, hasProjectAccess } = require('../middleware/auth');
const { 
  createProjectValidation, 
  projectIdValidation, 
  addMemberValidation 
} = require('../middleware/validation');

// Get all projects for current user
router.get('/', authenticateToken, projectController.getUserProjects);

// Create project (Admin only)
router.post('/', authenticateToken, isAdmin, createProjectValidation, projectController.createProject);

// Get single project
router.get('/:projectId', authenticateToken, projectIdValidation, hasProjectAccess, projectController.getProjectById);

// Update project (Project admin only)
router.put('/:projectId', authenticateToken, projectIdValidation, hasProjectAccess, isProjectAdmin, projectController.updateProject);

// Delete project (Project admin only)
router.delete('/:projectId', authenticateToken, projectIdValidation, hasProjectAccess, isProjectAdmin, projectController.deleteProject);

// Add member to project (Project admin only)
router.post('/:projectId/members', authenticateToken, hasProjectAccess, isProjectAdmin, projectController.addMember);

// Remove member from project (Project admin only)
router.delete('/:projectId/members/:userId', authenticateToken, projectIdValidation, hasProjectAccess, isProjectAdmin, projectController.removeMember);

module.exports = router;
