'use strict';

module.exports = app => {
  const { INTEGER, DATE, NOW, BOOLEAN } = app.Sequelize;
  const TopicFollow = app.model.define('topic-follow', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type:INTEGER,
      unique: 'topic_follow_index'
    },
    topicId: {
      type:INTEGER,
      unique: 'topic_follow_index'
    },
    hasFollow: {
      type: BOOLEAN,
      defaultValue: false,
      comment: '是否关注话题'
    },
    score: {
      type: INTEGER,
      comment: '贡献积分',
      defaultValue: 0
    },
    followDate: {
      type: DATE,
      defaultValue: NOW,
    }
  }, {
    underscored: false,
    timestamps: false,
  });
  return TopicFollow;
};
