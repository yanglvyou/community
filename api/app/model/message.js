'use strict';

module.exports = app => {

  const { TEXT, INTEGER, DATE, NOW } = app.Sequelize;
  const Message = app.model.define('message', {
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
  }, {
    underscored: false,
    timestamps: false,
  });
  return Message;
};
