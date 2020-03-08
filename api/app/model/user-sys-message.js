'use strict';

module.exports = app => {

    const { INTEGER,BOOLEAN, DATE, NOW } = app.Sequelize;
    const Message = app.model.define('user-sys-message', {
        id: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        toId: INTEGER,
        messageId: INTEGER,
        senDate: {
            type: DATE,
            defaultValue: NOW,
        },
        isRead: {
            type: BOOLEAN,
            defaultValue: false,
        }
    }, {
        underscored: false,
        timestamps: false,
    });
    return Message;
};
