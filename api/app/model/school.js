'use strict';

module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const School = app.model.define('school', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: STRING,
  }, {
    underscored: false,
    timestamps: false,
  });
  return School;
};
