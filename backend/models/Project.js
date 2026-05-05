module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Project name is required' },
        len: {
          args: [2, 200],
          msg: 'Project name must be between 2 and 200 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'active'
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
    tableName: 'projects',
    timestamps: true,
    underscored: true
  });

  Project.associate = (models) => {
    // Project belongs to User (creator)
    Project.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Project has many Users (members through ProjectMember)
    Project.belongsToMany(models.User, {
      through: models.ProjectMember,
      as: 'members',
      foreignKey: 'projectId',
      otherKey: 'userId'
    });

    // Project has many Tasks
    Project.hasMany(models.Task, {
      foreignKey: 'projectId',
      as: 'tasks',
      onDelete: 'CASCADE'
    });
  };

  return Project;
};
