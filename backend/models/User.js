module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        args: true,
        msg: 'Email already exists'
      },
      validate: {
        notEmpty: { msg: 'Email is required' },
        isEmail: { msg: 'Please enter a valid email address' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = (models) => {
    // User belongs to many Projects (through ProjectMember)
    User.belongsToMany(models.Project, {
      through: 'ProjectMembers',
      as: 'projects',
      foreignKey: 'userId',
      otherKey: 'projectId'
    });

    // User has many Tasks (as assignee)
    User.hasMany(models.Task, {
      foreignKey: 'assignedTo',
      as: 'assignedTasks'
    });

    // User has many Tasks (as creator)
    User.hasMany(models.Task, {
      foreignKey: 'createdBy',
      as: 'createdTasks'
    });
  };

  return User;
};
