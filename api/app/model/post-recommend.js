'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW, BOOLEAN } = app.Sequelize;
  const PostRecommend = app.model.define('post-recommend', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    postId: INTEGER,
    userId: INTEGER,
    posType: INTEGER,
    recommendType: {
        type: INTEGER,
        comment: '推荐类型(0:永久在推荐表,1:暂时24小时在推荐表)',
        defaultValue: 0,
    },
    senDate: {
      type: DATE,
      defaultValue: NOW,
    }
  }, {
    underscored: false,
    timestamps: false,
  });
  return PostRecommend;
};
