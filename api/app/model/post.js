module.exports = app => {
    const { STRING, INTEGER, DATE, BOOLEAN, JSON, DECIMAL, TEXT } = app.Sequelize;
    const Post = app.model.define('post', {
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
        introduction: STRING(500),
        content: STRING(280),
        imgs: {
            type: JSON,
            allowNull: true,
        },
        posType: {
            type: INTEGER,
            comment: '帖子类型(0:动弹,1:文章-分享链接,2:文章-富文本,3:问答-问题,4:问答-答案,5:投票,6:纸飞机)',
            defaultValue: 0, // 0动弹1表白
        },
        link: STRING(300),
        video: JSON,
        audio: JSON,
        senDate: {
            type: DATE,
            defaultValue: app.Sequelize.NOW,
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
    }, {
        underscored: false,
        timestamps: false,
    })
    return Post
}