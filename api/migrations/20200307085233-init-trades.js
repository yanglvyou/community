'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE } = Sequelize;
    await queryInterface.createTable('trades', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: INTEGER,
      fromId: INTEGER,
      shell: INTEGER,
      money: INTEGER,
      type: {
        type: INTEGER,
        defaultValue: 0,
        comment: '交易类型(0:变现,1:转换)'
      },
      state: {
        type: INTEGER,
        comment: '变现状态(0:申请中,1:已发放,2:已拒绝)'
      },
      addDate: {
        type: DATE,
        defaultValue: Sequelize.NOW,
        comment: '申请时间',
      },
      senDate: {
        type: DATE,
        comment: '发放时间',
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
    await queryInterface.dropTable('trades');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
