const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Check if user is admin of specific project
const isProjectAdmin = async (req, res, next) => {
  try {
    const { ProjectMember } = require('../models');
    const projectId = req.params.projectId || req.body.projectId;
    
    // Global admin bypass
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is project admin
    const membership = await ProjectMember.findOne({
      where: { 
        projectId, 
        userId: req.user.id,
        role: 'admin'
      }
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Project admin role required.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking project admin status.',
      error: error.message
    });
  }
};

// Check if user has access to project (is member or admin)
const hasProjectAccess = async (req, res, next) => {
  try {
    const { Project, ProjectMember } = require('../models');
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin has access to all projects
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is a member of the project
    const member = await ProjectMember.findOne({
      where: {
        projectId,
        userId
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking project access.',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isProjectAdmin,
  hasProjectAccess
};
