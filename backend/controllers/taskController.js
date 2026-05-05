const { Task, Project, User, ProjectMember, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;
    const userId = req.user.id;

    // Check if project exists
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Note: Access check (admin only) is handled by isProjectAdmin middleware

    // If assignedTo is provided, check if user is project member
    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: 'Assignee user not found'
        });
      }

      const isAssigneeMember = await ProjectMember.findOne({
        where: { projectId, userId: assignedTo }
      });

      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member. Please add the user to the project first.'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      projectId,
      assignedTo,
      createdBy: userId
    });

    // Fetch task with associations
    const taskWithDetails = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    // Create notification for assignee if task is assigned
    if (assignedTo && assignedTo !== userId) {
      const creator = await User.findByPk(userId, { attributes: ['name'] });
      await createNotification(
        assignedTo,
        'task_assigned',
        'New Task Assigned',
        `${creator.name} assigned you a task: "${title}" in project "${project.name}"`,
        {
          relatedId: task.id,
          relatedType: 'task',
          createdBy: userId
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: taskWithDetails }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// Get all tasks for current user
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { projectId, status, priority, assigneeId, overdue } = req.query;

    let whereClause = {};
    
    if (userRole !== 'admin') {
      // Members see only their assigned tasks or tasks in their projects
      const userProjects = await ProjectMember.findAll({
        where: { userId },
        attributes: ['projectId']
      });
      const projectIds = userProjects.map(p => p.projectId);

      whereClause = {
        [Op.or]: [
          { assignedTo: userId },
          { projectId: { [Op.in]: projectIds } }
        ]
      };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (assigneeId) {
      whereClause.assignedTo = assigneeId;
    }

    if (overdue === 'true') {
      whereClause.dueDate = { [Op.lt]: new Date() };
      whereClause.status = { [Op.ne]: 'done' };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { 
          model: Project, 
          as: 'project',
          include: [{ model: User, as: 'members' }]
        },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access for non-admin users
    if (req.user.role !== 'admin') {
      const isMember = task.project.members.some(m => m.id === req.user.id);
      const isAssignee = task.assignedTo === req.user.id;
      
      if (!isMember && !isAssignee) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: 'project', include: [{ model: User, as: 'members' }] }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const isAdmin = userRole === 'admin';
    const isCreator = task.createdBy === userId;
    const isAssignee = task.assignedTo === userId;
    const isMember = task.project.members.some(m => m.id === userId);

    // Only admin or creator can change all fields
    // Assignee can only update status of tasks assigned to them
    if (!isAdmin && !isCreator) {
      if (isAssignee && status && Object.keys(req.body).length === 1) {
        // Assignee can only update status (and nothing else)
        await task.update({ status });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only task creator or admin can update task details.'
        });
      }
    } else {
      // Admin or creator can update all fields
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

      await task.update(updateData);
    }

    // Fetch updated task
    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    // Create notifications for relevant parties
    const updater = await User.findByPk(userId, { attributes: ['name'] });

    // If status changed to done, notify creator
    if (status === 'done' && task.status !== 'done' && task.createdBy !== userId) {
      await createNotification(
        task.createdBy,
        'task_completed',
        'Task Completed',
        `${updater.name} completed the task "${updatedTask.title}"`,
        {
          relatedId: taskId,
          relatedType: 'task',
          createdBy: userId
        }
      );
    }

    // If task was reassigned to someone new, notify them
    if (assignedTo && assignedTo !== task.assignedTo && assignedTo !== userId) {
      await createNotification(
        assignedTo,
        'task_assigned',
        'Task Assigned to You',
        `${updater.name} assigned you the task "${updatedTask.title}"`,
        {
          relatedId: taskId,
          relatedType: 'task',
          createdBy: userId
        }
      );
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only task creator or admin can delete the task'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = {};

    if (userRole !== 'admin') {
      // For members, get tasks from their projects or assigned to them
      const userProjects = await ProjectMember.findAll({
        where: { userId },
        attributes: ['projectId']
      });
      const projectIds = userProjects.map(p => p.projectId);

      whereClause = {
        [Op.or]: [
          { assignedTo: userId },
          { projectId: { [Op.in]: projectIds } }
        ]
      };
    }

    // Total tasks
    const totalTasks = await Task.count({ where: whereClause });

    // Completed tasks
    const completedTasks = await Task.count({
      where: { ...whereClause, status: 'done' }
    });

    // In-progress tasks
    const inProgressTasks = await Task.count({
      where: { ...whereClause, status: 'in-progress' }
    });

    // Todo tasks
    const todoTasks = await Task.count({
      where: { ...whereClause, status: 'todo' }
    });

    // Overdue tasks
    const overdueTasks = await Task.count({
      where: {
        ...whereClause,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'done' }
      }
    });

    // High priority tasks
    const highPriorityTasks = await Task.count({
      where: { ...whereClause, priority: 'high' }
    });
    
    // Total users (admin only)
    let totalUsers = null;
    let totalProjects = null;
    if (userRole === 'admin') {
      totalUsers = await User.count();
      totalProjects = await Project.count();
    }

    // Tasks by status for chart
    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    // Tasks by priority for chart
    const tasksByPriority = await Task.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['priority'],
      raw: true
    });

    // Recent tasks
    const recentTasks = await Task.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        stats: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          overdue: overdueTasks,
          highPriority: highPriorityTasks,
          totalUsers,
          totalProjects
        },
        tasksByStatus,
        tasksByPriority,
        recentTasks
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { body } = req.body;
    const userId = req.user.id;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment body is required'
      });
    }

    const task = await Task.findByPk(taskId, {
      include: [
        { 
          model: Project, 
          as: 'project',
          include: [{ model: User, as: 'members' }]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (req.user.role !== 'admin') {
      const isMember = task.project.members.some(member => member.id === userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const comment = await Comment.create({
      body: body.trim(),
      taskId,
      authorId: userId
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    // Notify task creator and assignee about the comment (except the commenter)
    const commenter = await User.findByPk(userId, { attributes: ['name'] });
    const notifiedUsers = new Set();

    // Notify task creator
    if (task.createdBy !== userId) {
      await createNotification(
        task.createdBy,
        'comment_added',
        'New Comment on Task',
        `${commenter.name} commented on task "${task.title}"`,
        {
          relatedId: taskId,
          relatedType: 'task',
          createdBy: userId
        }
      );
      notifiedUsers.add(task.createdBy);
    }

    // Notify assignee
    if (task.assignedTo && task.assignedTo !== userId && !notifiedUsers.has(task.assignedTo)) {
      await createNotification(
        task.assignedTo,
        'comment_added',
        'New Comment on Your Task',
        `${commenter.name} commented on your task "${task.title}"`,
        {
          relatedId: taskId,
          relatedType: 'task',
          createdBy: userId
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: commentWithAuthor }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.findAll({
      where: { taskId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: { comments }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};
