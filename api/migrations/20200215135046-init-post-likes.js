'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW, BOOLEAN } = Sequelize;
    await queryInterface.createTable('post-likes', {
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
        comment: '类型:0帖子,1评论',
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
    await queryInterface.dropTable('post-likes');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
