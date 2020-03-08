'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, NOW } = Sequelize;
    await queryInterface.createTable('user-follows', { 
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fromId: INTEGER,
      toId: INTEGER,
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
    await queryInterface.dropTable('user-follows');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
