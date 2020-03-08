'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, INTEGER, DATE, BOOLEAN, JSON, DECIMAL, TEXT, NOW } = Sequelize;
    await queryInterface.createTable('posts', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: INTEGER,
      questionId: INTEGER,
      articleTitle: STRING(60),
      articleImg: STRING(500),
      articleHtml: TEXT,
      articleDelta: JSON,
      introduction: STRING(140),
      content: STRING(280),
      imgs: {
        type: JSON,
        allowNull: true,
      },
      posType: {
        type: INTEGER,
        comment: '帖子类型(0:动弹,1:文章,2:问答,3:投票)',
        defaultValue: 0, // 0动弹1表白
      },
      link: STRING(128),
      video: JSON,
      audio: JSON,
      senDate: {
        type: DATE,
        defaultValue: NOW,
        comment: '发布时间',
      },
      thumbsCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      commentCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      viewCount: {
        type: INTEGER,
        defaultValue: 0,
      },
      topicId: INTEGER,
      topicTitle: STRING,
      latitude: DECIMAL(10, 7),
      longitude: DECIMAL(10, 7),
      address: STRING, // 发布位置
      isRecommend: {
        type: BOOLEAN,
        defaultValue: false
      },
      isTop: {
        type: BOOLEAN,
        defaultValue: false
      },
      shell: {
        type: INTEGER,
        comment: '累计打赏玉帛贝数量',
        defaultValue: 0,
      }
    })
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('posts');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
