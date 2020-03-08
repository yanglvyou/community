'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW, BOOLEAN } = Sequelize;
    await queryInterface.createTable('user-messages', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      toUserId: INTEGER,
      messageId: INTEGER,
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
    await queryInterface.dropTable('user-messages');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
