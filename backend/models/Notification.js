module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    type: {
      type: DataTypes.ENUM('task_assigned', 'task_updated', 'project_invite', 'member_added', 'task_completed', 'comment_added'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id'
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_type'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'created_by'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'recipient'
    });
    
    Notification.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'actor'
    });
  };

  return Notification;
};
