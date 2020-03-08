'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW, BOOLEAN } = app.Sequelize;
  const PostLike = app.model.define('post-like', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: INTEGER,
      unique: 'post_like_index'
    },
    toId: INTEGER,
    postId: {
      type:INTEGER,
      unique: 'post_like_index'
    },
    commentId: {
      type:INTEGER,
      unique: 'post_like_index'
    },
    likeType: {
      type: INTEGER,
      defaultValue: 0,
      unique: 'post_like_index',
      comment: '类型:0帖子,1评论,2:回复',
    },
    senDate: {
      type: DATE,
      defaultValue: NOW,
    },
    isRead: {
      type: BOOLEAN,
      defaultValue: false,
    },
  }, {
    underscored: false,
    timestamps: false,
  });
  return PostLike;
};
