module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Task title is required' },
        len: {
          args: [2, 200],
          msg: 'Task title must be between 2 and 200 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('todo', 'in-progress', 'done'),
      allowNull: false,
      defaultValue: 'todo'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      field: 'project_id'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'assigned_to'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'created_by'
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    underscored: true
  });

  Task.associate = (models) => {
    // Task belongs to Project
    Task.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });

    // Task belongs to User (assignee)
    Task.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });

    // Task belongs to User (creator)
    Task.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Task has many Comments
    Task.hasMany(models.Comment, {
      foreignKey: 'taskId',
      as: 'comments',
      onDelete: 'CASCADE'
    });
  };

  return Task;
};
