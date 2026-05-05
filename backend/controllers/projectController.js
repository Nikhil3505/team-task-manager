const { Project, User, ProjectMember, Task, sequelize } = require('../models');
const { createNotification } = require('./notificationController');

// Create project
exports.createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Create project
    const project = await Project.create({
      name,
      description,
      createdBy: userId
    }, { transaction });

    // Add creator as project admin
    await ProjectMember.create({
      projectId: project.id,
      userId: userId,
      role: 'admin'
    }, { transaction });

    await transaction.commit();

    // Fetch project with creator and members
    const projectWithDetails = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: projectWithDetails }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create project error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating project: ' + error.message,
      error: error.message
    });
  }
};

// Get all projects for current user
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { ProjectMember } = require('../models');

    let projects;
    if (userRole === 'admin') {
      // Admin can see all projects
      projects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { 
            model: User, 
            as: 'members', 
            attributes: ['id', 'name', 'email']
          },
          { 
            model: Task, 
            as: 'tasks',
            include: [
              { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
          }
        ]
      });
    } else {
      // Members see only their projects
      const user = await User.findByPk(userId, {
        include: [{
          model: Project,
          as: 'projects',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { 
              model: User, 
              as: 'members', 
              attributes: ['id', 'name', 'email']
            },
            { 
              model: Task, 
              as: 'tasks',
              include: [
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
              ]
            }
          ]
        }]
      });
      projects = user.projects;
    }

    // Fetch all ProjectMembers for these projects to get roles
    const projectIds = projects.map(p => p.id);
    const memberships = await ProjectMember.findAll({
      where: { projectId: projectIds }
    });

    // Create a map of user roles per project
    const roleMap = {};
    memberships.forEach(m => {
      const key = `${m.projectId}-${m.userId}`;
      roleMap[key] = m.role;
    });

    // Transform projects to include member roles
    const transformedProjects = projects.map(project => {
      const p = project.toJSON();
      if (p.members) {
        p.members = p.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: roleMap[`${p.id}-${member.id}`] || 'member'
        }));
      }
      return p;
    });

    res.json({
      success: true,
      data: { projects: transformedProjects }
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userRole = req.user.role;
    const { ProjectMember } = require('../models');

    console.log('Fetching project ID:', projectId);

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { 
          model: User, 
          as: 'members', 
          attributes: ['id', 'name', 'email']
        },
        { 
          model: Task, 
          as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Fetch ProjectMembers to get roles
    const memberships = await ProjectMember.findAll({
      where: { projectId }
    });
    console.log('Project memberships found:', memberships.length);
    console.log('Memberships:', memberships.map(m => ({ userId: m.userId, role: m.role })));

    // Create a map of userId -> role
    const roleMap = {};
    memberships.forEach(m => {
      roleMap[m.userId] = m.role;
    });

    // Transform members to include role
    const transformedProject = project.toJSON();
    console.log('Raw project members:', transformedProject.members);
    
    if (transformedProject.members) {
      transformedProject.members = transformedProject.members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: roleMap[member.id] || 'member'
      }));
    }
    
    console.log('Transformed members:', transformedProject.members);

    // Check access for non-admin users
    if (userRole !== 'admin') {
      const isMember = transformedProject.members.some(member => member.id === req.user.id);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { project: transformedProject }
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project admin (or global admin)
    if (req.user.role !== 'admin') {
      const membership = await ProjectMember.findOne({
        where: { projectId, userId: req.user.id }
      });
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only project admins can update this project'
        });
      }
    }

    await project.update({
      name: name || project.name,
      description: description !== undefined ? description : project.description,
      status: status || project.status
    });

    // Fetch updated project with details
    const updatedProject = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project (Project admin only)
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project admin (or global admin)
    if (req.user.role !== 'admin') {
      const membership = await ProjectMember.findOne({
        where: { projectId, userId: req.user.id }
      });
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only project admins can delete this project'
        });
      }
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;

    console.log('Adding member to project:', projectId, 'email:', email, 'role:', role);

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Look up user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    console.log('Found user:', user.id, user.name);

    // Check if already a member
    const existingMember = await ProjectMember.findOne({
      where: { projectId, userId: user.id }
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either admin or member'
      });
    }

    // Add member with role
    const newMembership = await ProjectMember.create({ 
      projectId, 
      userId: user.id,
      role 
    });

    console.log('Created ProjectMember:', newMembership.toJSON());

    // Create notification for the added member
    const projectData = await Project.findByPk(projectId, { attributes: ['name'] });
    const addedBy = await User.findByPk(req.user.id, { attributes: ['name'] });
    await createNotification(
      user.id,
      'project_invite',
      'Added to Project',
      `${addedBy.name} added you to project "${projectData.name}" as ${role}`,
      {
        relatedId: projectId,
        relatedType: 'project',
        createdBy: req.user.id
      }
    );

    res.json({
      success: true,
      message: 'Member added to project successfully'
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Prevent removing the project creator
    if (parseInt(userId) === project.createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator'
      });
    }

    const member = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      });
    }

    await member.destroy();

    res.json({
      success: true,
      message: 'Member removed from project successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};
