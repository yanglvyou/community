module.exports = app => {
    const { STRING, INTEGER, DATE, NOW, BOOLEAN, JSON } = app.Sequelize;
    const PostComment = app.model.define('post-comment', {
        id: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        fromId: INTEGER,
        toId: INTEGER,
        postId: INTEGER,
        commentId: INTEGER,
        replyId: INTEGER,
        commenType: {
            type: INTEGER,
            defaultValue: 0,
            comment: '0:帖子,1:评论,2:回复,8:回复纸飞机',
        },
        content: STRING(500),
        imgs: JSON,
        thumbsCount: {
            type: INTEGER,
            defaultValue: 0,
        },
        replyCount: {
            type: INTEGER,
            defaultValue: 0,
        },
        senDate: {
            type: DATE,
            defaultValue: NOW,
        },
        isRead: {
            type: BOOLEAN,
            defaultValue: false,
        },
        isHot: {
            type: BOOLEAN,
            defaultValue: false,
        },
    }, {
        underscored: false,
        timestamps: false,
    })
    return PostComment
}