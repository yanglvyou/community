'use strict';

module.exports = app => {
    const { INTEGER, DATE } = app.Sequelize;
    const Trade = app.model.define('trade', {
        id: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: INTEGER,
        fromId: INTEGER,
        shell: INTEGER,
        money: INTEGER,
        type: {
            type: INTEGER,
            defaultValue: 0,
            comment: '交易类型(0:变现,1:转换,2:打赏别人,3:收到的打赏)'
        },
        state: {
            type: INTEGER,
            comment: '变现状态(0:申请中,1:已发放,2:已拒绝)'
        },
        addDate: {
            type: DATE,
            defaultValue: app.Sequelize.NOW,
            comment: '添加时间',
        },
        senDate: {
            type: DATE,
            comment: '发放时间',
        },
    }, {
        underscored: false,
        timestamps: false,
    });
    return Trade;
};
