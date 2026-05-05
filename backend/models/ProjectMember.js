module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define('ProjectMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member'
    }
  }, {
    tableName: 'project_members',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'user_id']
      }
    ]
  });

  return ProjectMember;
};
