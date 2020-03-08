'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW, BOOLEAN } = Sequelize;
    await queryInterface.createTable('user-notices', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      toId: INTEGER,
      fromId: INTEGER,
      postId: INTEGER,
      commentId: INTEGER,
      replyId: INTEGER,
      noticeType: {
          type: INTEGER,
          comment: '0:点赞帖子，1:点赞评论，2:评论，3:回复，4:关注，5:回答',
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
    });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user-notices');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
