module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Comment body is required' },
        len: {
          args: [1, 1000],
          msg: 'Comment must be between 1 and 1000 characters'
        }
      }
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      },
      field: 'task_id',
      onDelete: 'CASCADE'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'author_id'
    }
  }, {
    tableName: 'comments',
    timestamps: true,
    underscored: true
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });

    Comment.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
  };

  return Comment;
};
