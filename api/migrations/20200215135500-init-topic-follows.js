'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW, BOOLEAN } = Sequelize;
    await queryInterface.createTable('topic-follows', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: INTEGER,
      topicId: INTEGER,
      hasFollow: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否关注话题'
      },
      score: {
        type: INTEGER,
        comment: '贡献积分',
        defaultValue: 0
      },
      followDate: {
        type: DATE,
        defaultValue: NOW,
      }
    });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('topic-follows');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
