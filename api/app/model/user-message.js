'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW, BOOLEAN } = app.Sequelize;
  const UserNotice = app.model.define('user-message', {
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
  }, {
    underscored: false,
    timestamps: false,
  });
  return UserNotice;
};
