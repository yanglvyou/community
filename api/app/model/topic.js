'use strict';

module.exports = app => {
    const { INTEGER, STRING, BOOLEAN } = app.Sequelize;
    const Topic = app.model.define('topic', {
        id: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: STRING,
            unique: true
        },
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
    }, {
        underscored: false,
        timestamps: false,
    });
    return Topic
}