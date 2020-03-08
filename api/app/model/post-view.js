'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW } = app.Sequelize;
  const PostView = app.model.define('post-view', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: INTEGER,
    postId: INTEGER,
    senDate: {
      type: DATE,
      defaultValue: NOW,
    }
  }, {
    underscored: false,
    timestamps: false,
  });
  return PostView;
};
