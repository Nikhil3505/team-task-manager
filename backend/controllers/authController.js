const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');

// Generate Access Token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Generate both tokens and save refresh token to DB
const generateTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Calculate expiration date
  const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Save refresh token to database
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt
  });
  
  return { accessToken, refreshToken };
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'member'
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return response (exclude password, only access token in body)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Refresh access token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if token exists in database
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken }
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await tokenRecord.destroy();
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old token (rotation)
    await tokenRecord.destroy();

    // Generate new tokens
    const tokens = await generateTokens(user);

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      // Delete refresh token from database
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get all users (for admin to assign tasks)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Search users (for member invite)
exports.searchUsers = async (req, res) => {
  try {
    const { q, projectId } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${q.trim()}%`;
    const { Op } = require('sequelize');
    const { ProjectMember } = require('../models');
    
    // Build where clause
    const whereClause = {
      [Op.or]: [
        { name: { [Op.iLike]: searchTerm } },
        { email: { [Op.iLike]: searchTerm } }
      ]
    };

    // If projectId provided, exclude existing members
    let excludeUserIds = [];
    if (projectId) {
      const members = await ProjectMember.findAll({
        where: { projectId },
        attributes: ['userId']
      });
      excludeUserIds = members.map(m => m.userId);
    }

    if (excludeUserIds.length > 0) {
      whereClause.id = { [Op.notIn]: excludeUserIds };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role'],
      limit: 10
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};
