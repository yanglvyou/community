'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { TEXT, INTEGER, DATE, NOW } = Sequelize;
    await queryInterface.createTable('messages', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: TEXT('tiny'),
      contentType: {
        type: INTEGER,
        defaultValue: 0,
        comment: '0:文本,1:富文本',
      },
      createDate: {
        type: DATE,
        defaultValue: NOW,
      },
    })
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('messages');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
