'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, BOOLEAN } = Sequelize;
    await queryInterface.createTable('topics', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: STRING,
      des: STRING,
      iconSrc: STRING,
      nickName: {
        type: STRING,
        defaultValue: '书虫',
        comment: '话题用户别称'
      },
      topicType: {
        type: INTEGER,
        defaultValue: 0,
        comment: '话题类型:(0:系统话题,1:用户自定义话题)'
      },
      ownerId: {
        type: INTEGER,
        defaultValue: 1,
        comment: '话题创造者'
      },
      followCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      postCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      isTop: {
        type: BOOLEAN,
        defaultValue: false,
      },
      isActivity: {
        type: BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('topics');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
