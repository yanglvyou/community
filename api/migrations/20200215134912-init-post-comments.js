'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, INTEGER, DATE, NOW, BOOLEAN, JSON } = Sequelize;
    await queryInterface.createTable('post-comments', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fromId: INTEGER,
      toId: INTEGER,
      postId: INTEGER,
      commentId: INTEGER,
      replyId: INTEGER,
      commenType: {
        type: INTEGER,
        defaultValue: 0,
        comment: '0:评论帖子,1:回复评论,2:回复评论的回复',
      },
      content: STRING(500),
      imgs: JSON,
      thumbsCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      replyCount: {
        type: INTEGER,
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
      isHot: {
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
    await queryInterface.dropTable('post-comments');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
