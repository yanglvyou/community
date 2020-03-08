'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW } = app.Sequelize;
  const UserFollow = app.model.define('user-follow', {
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
  }, {
    underscored: false,
    timestamps: false,
  });
  return UserFollow;
};
