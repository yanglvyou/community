'use strict';
const moment = require('moment');
moment.locale('zh-cn');

const Controller = require('./baseController');

class MessageController extends Controller {
    async notice() {
        const user = await this.findByPk(this.user.userId, ['sysMsgCount', 'noticeCount'], 'User')
        if (user) {
            this.success(user)
            return
        }
        this.fail()
    }
    async list() {
        const { pageIndex, pageSize, begin, isRefresh } = this.ctx.request.body
        let where = {
            toId: this.user.userId
        };
        if (begin) {
            if (isRefresh) { // 刷新
                where.senDate = {
                    [this.Op.gt]: begin,
                };
            } else { // 加载更多
                where.senDate = {
                    [this.Op.lt]: begin,
                };
            }
        }
        const _items = await this.findAll(null, where, [['isRead', 'ASC'], ['senDate', 'DESC']], pageIndex, pageSize, 'UserNotice')
        for (const _item of _items) {
            _item.user = await this.getUserInfo(_item.fromId)
            _item.moment = moment(_item.senDate).fromNow();
            if (_item.postId) {
                _item.post = await this.findByPk(_item.postId, ['id', 'imgs'], 'Post')
            }
            if (_item.commentId) {
                _item.comment = await this.findByPk(_item.commentId, ['id', 'content', 'imgs'], 'PostComment')
            }
            if (_item.noticeType === 6) {
                _item.hasFollow = await this.count({
                    fromId: _item.toId,
                    toId: _item.fromId
                }, 'UserFollow') > 0
                console.log(_item.hasFollow);

            }
        }
        this.success(_items)
    }
    async sysList() {
        const { pageIndex, pageSize, begin, isRefresh } = this.ctx.request.body
        let where = {
            toId: this.user.userId
        };
        if (begin) {
            if (isRefresh) { // 刷新
                where.senDate = {
                    [this.Op.gt]: begin,
                };
            } else { // 加载更多
                where.senDate = {
                    [this.Op.lt]: begin,
                };
            }
        }
        const _items = await this.findAll(null, where, [['isRead', 'ASC'], ['senDate', 'DESC']], pageIndex, pageSize, 'UserSysMessage')
        for (const _item of _items) {
            _item.moment = moment(_item.senDate).fromNow();
            _item.message = await this.findByPk(_item.messageId, null, 'Message')
        }
        this.success(_items)
    }
    async read() {
        const { id, isSys } = this.ctx.request.body
        const where = {
            toId: this.user.userId
        }
        if (id) {
            where.id = id
        }
        if (await this.update({
            isRead: true
        }, {
            where
        }, isSys ? 'UserSysMessage' : 'UserNotice')) {
            if (id) {
                await this.decrement(isSys ? 'sysMsgCount' : 'noticeCount', {
                    id: this.user.userId
                }, 1, null, 'User')
            } else {
                await this.update({
                    noticeCount: 0
                }, {
                    where: {
                        id: this.user.userId
                    }
                }, 'User')
            }
        }
        this.success()
    }
}

module.exports = MessageController;