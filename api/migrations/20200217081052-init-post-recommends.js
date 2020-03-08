'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW } = Sequelize;
    await queryInterface.createTable('post-recommends', {
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
    });
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('post-recommends');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
