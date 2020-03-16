const BaseController = require('./base-controller.js')
const moment = require('moment');
moment.locale('zh-cn');
class MessageController extends BaseController {
    constructor() {
        super()
    }
    async notice(data, context) {
        const user = await this.getByKey('users', context.OPENID, {
            sysMsgCount: true,
            noticeCount: true
        })
        if (user) {
            return this.success(user)
        }
        return this.fail()
    }
    async list(data, context) {
        const { pageIndex, pageSize, begin, isRefresh } = data
        const where = [
            {
                toId: context.OPENID
            }
        ]
        if (begin) {
            if (isRefresh) {
                where.push({
                    senDate: _.gt(begin)
                })
            } else {
                where.push({
                    senDate: _.lt(begin)
                })
            }
        }
        const items = await db.collection('userNotices').where(_.and(where))
            .orderBy('isRead', 'asc')
            .orderBy('senDate', 'desc')
            .skip((pageIndex - 1) * pageSize)
            .limit(pageSize)
            .get().then(res => res.data).catch(() => [])
        for (const item of items) {
            item.user = await this.getUserInfo(item.fromId)
            item.moment = moment(item.senDate).fromNow();
            if (item.postId) {
                item.post = await this.getByKey('posts', item.postId, {
                    imgs: true
                })
            }
            if (item.commentId) {
                item.comment = await this.getByKey('postComments', item.commentId, {
                    content: true,
                    imgs: true
                })
            }
            if (item.noticeType === 6) {
                item.hasFollow = await db.collection('userFollows').where(_.and([
                    {
                        fromId: item.toId,
                    }, {
                        toId: item.fromId
                    }
                ])).then(res => res.total > 0).catch(() => false)
            }
        }
        return this.success(items)
    }
    async sysList(data, context) {
        const { pageIndex, pageSize, begin, isRefresh } = data
        const where = [
            {
                toId: context.OPENID
            }
        ]
        if (begin) {
            if (isRefresh) {
                where.push({
                    senDate: _.gt(begin)
                })
            } else {
                where.push({
                    senDate: _.lt(begin)
                })
            }
        }
        const items = await db.collection('userSysMessages')
            .where(_.and(where))
            .orderBy('isRead', 'asc')
            .orderBy('senDate', 'desc')
            .skip((pageIndex - 1) * pageSize)
            .limit(pageSize)
            .get().then(res => res.data).catch(() => [])
        for (const item of items) {
            item.moment = moment(item.senDate).fromNow();
            item.message = await this.getByKey('messages', item.messageId, {})
        }
        return this.success(items)
    }
    async read(data, context) {
        const { id, isSys } = data
        const tb = isSys ? 'userSysMessages' : 'userNotices'
        if (id) {
            const msg = await this.getByKey(tb, id, null)
            if (msg && msg.toId === context.OPENID) {
                if (await db.collection(tb).doc(id).update({
                    data: {
                        isRead: true
                    }
                }).catch(() => false)) {
                    return await db.collection(tb).doc(context.OPENID).update({
                        data: {
                            [isSys ? 'sysMsgCount' : 'noticeCount']: _.inc(-1)
                        }
                    }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
                }
            }
        } else {
            if (await db.collection(tb).where({
                toId: context.OPENID
            }).update({
                data: {
                    isRead: true
                }
            }).catch(() => false)) {
                return await db.collection('users').doc(context.OPENID).update({
                    data: {
                        noticeCount: 0
                    }
                }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
            }
        }
        return this.fail(10002, '2')
    }
}
module.exports = MessageController;