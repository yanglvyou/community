'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW, BOOLEAN } = app.Sequelize;
  const UserNotice = app.model.define('user-notice', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    toId: INTEGER,
    fromId: INTEGER,
    postId: INTEGER,
    commentId: INTEGER,
    replyId: INTEGER, // 回复原评论的ID
    noticeType: {
      type: INTEGER,
      comment: '0:评论帖子,1:回复评论,2:回复评论的回复,3:点赞帖子,4:点赞评论,5:点赞回复,6:关注,7:回答,8:纸飞机,9:收到打赏',
      defaultValue: 0,
    },
    shell: {
      type: INTEGER,
      comment: '打赏玉帛贝数量',
      defaultValue: 0,
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
  return UserNotice;
};
