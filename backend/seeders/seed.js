require('dotenv').config();
const { User, Project, ProjectMember, Task, RefreshToken, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('Starting database seed...');

    // Ensure connection is established
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Clear existing data
    await RefreshToken.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await ProjectMember.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    const memberUser = await User.create({
      name: 'Member User',
      email: 'member@test.com',
      password: hashedPassword,
      role: 'member'
    });

    const member2 = await User.create({
      name: 'Team Member 2',
      email: 'member2@test.com',
      password: hashedPassword,
      role: 'member'
    });

    console.log('Users created');

    // Create project
    const project = await Project.create({
      name: 'Demo Project',
      description: 'A sample project to demonstrate the task manager features',
      createdBy: adminUser.id
    });

    // Add admin as project member
    await ProjectMember.create({
      projectId: project.id,
      userId: adminUser.id
    });

    // Add members to project
    await ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id
    });

    await ProjectMember.create({
      projectId: project.id,
      userId: member2.id
    });

    console.log('Project and members created');

    // Create tasks
    const tasks = [
      {
        title: 'Setup project environment',
        description: 'Configure the development environment and install dependencies',
        status: 'done',
        priority: 'high',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id
      },
      {
        title: 'Design database schema',
        description: 'Create ER diagrams and define database relationships',
        status: 'done',
        priority: 'high',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id
      },
      {
        title: 'Implement authentication',
        description: 'Add JWT-based authentication with refresh tokens',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: memberUser.id,
        createdBy: adminUser.id
      },
      {
        title: 'Build task management UI',
        description: 'Create React components for task CRUD operations',
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: member2.id,
        createdBy: adminUser.id
      },
      {
        title: 'Add Kanban board',
        description: 'Implement drag-and-drop Kanban board using @hello-pangea/dnd',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: memberUser.id,
        createdBy: adminUser.id
      },
      {
        title: 'Create dashboard charts',
        description: 'Add Recharts for data visualization',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: null,
        createdBy: adminUser.id
      },
      {
        title: 'Implement comments feature',
        description: 'Allow users to add comments on tasks',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: member2.id,
        createdBy: adminUser.id
      },
      {
        title: 'Add task filters',
        description: 'Enable filtering by status, priority, assignee, and overdue',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedTo: null,
        createdBy: adminUser.id
      }
    ];

    await Task.bulkCreate(tasks);
    console.log('Tasks created');

    console.log('Seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@test.com / password123');
    console.log('Member: member@test.com / password123');
    console.log('Member2: member2@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
