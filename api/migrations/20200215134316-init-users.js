'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const {
      STRING,
      INTEGER,
      DATE,
      DATEONLY,
      BOOLEAN,
      NOW,
    } = Sequelize;
    await queryInterface.createTable('users', {
      id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      openId: {
        type: STRING,
        unique: true,
      },
      unionid: {
        type: STRING,
        unique: true,
        comment: '用户在开放平台的唯一标识符',
      },
      shareId: {
        type: INTEGER,
        comment: '分享者ID'
      },
      gzhId: {
        type: STRING,
        comment: '公众号openId',
      },
      platform: {
        type: STRING,
        comment: '平台:微信｜QQ',
      },
      subscribe: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否订阅公众号',
      },
      nick: {
        type: STRING,
        comment: '昵称',
      },
      avtater: {
        type: STRING,
        comment: '头像',
      },
      feeling: {
        type: INTEGER,
        defaultValue: 0, // (0:单身,1:恋爱中,2:保密)
        comment: '情感',
      },
      birthday: {
        type: DATEONLY,
        comment: '生日',
      },
      constellation: {
        type: STRING,
        comment: '星座',
      },
      gender: {
        type: INTEGER,
        defaultValue: 0,
        comment: '性别(0|未知,1男性,2|女性)',
      },
      province: {
        type: STRING,
        comment: '省份',
      },
      city: {
        type: STRING,
        comment: '城市',
      },
      registerDate: {
        type: DATE,
        defaultValue: NOW,
        comment: '注册时间',
      },
      isAuth: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否学生认证',
      },
      realName: {
        type: STRING,
        comment: '真实姓名',
      },
      authSrc: {
        type: STRING,
        comment: '认证图片地址',
      },
      title: {
        type: STRING,
        comment: '头衔',
      },
      isBinding: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否绑定个人信息',
      },
      signature: {
        type: STRING,
        comment: '个性签名',
      },
      school: {
        type: STRING,
        comment: '就读学校',
      },
      education: {
        type: INTEGER,
        comment: '学历(0专科,1本科,2硕士,3博士)',
      },
      enrollmentYear: {
        type: INTEGER,
        comment: '入学年份',
      },
      userType: {
        type: INTEGER,
        defaultValue: 0,
        comment: '用户类型(0普通用户1系统用户2虚拟用户)',
      },
      grade: {
        type: INTEGER,
        defaultValue: 0,
        comment: '用户等级(0普通1优秀2高级3VIP)',
      },
      sysMsgCount: {
        type: INTEGER,
        comment: '未读系统消息',
        defaultValue: 0,
      },
      noticeCount: {
        type: INTEGER,
        comment: '未读用户消息',
        defaultValue: 0,
      },
      followNum: {
        type: INTEGER,
        comment: '关注',
        defaultValue: 0,
      },
      fansNum: {
        type: INTEGER,
        comment: '粉丝数',
        defaultValue: 0,
      },
      thumbsNum: {
        type: INTEGER,
        comment: '获赞数',
        defaultValue: 0,
      },
      drill: {
        type: INTEGER,
        comment: '玉帛钻',
        defaultValue: 100,
      },
      shell: {
        type: INTEGER,
        comment: '玉帛贝',
        defaultValue: 0,
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
    await queryInterface.dropTable('users');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
