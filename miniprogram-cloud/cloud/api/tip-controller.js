const BaseController = require('./base-controller.js')
const moment = require('moment');
moment.locale('zh-cn');
class TipController extends BaseController {
    constructor() {
        super()
    }
    async reward(data, context) {
        const { toId, postId, num } = data
        const fromId = context.OPENID
        const user = await this._get(fromId)
        if (user) {
            if (user.drill < num) {
                return this.fail(10030, '玉帛币不足')
            }
            return await db.runTransaction(async t => {
                if (!await t.collection('users').doc(fromId).update({
                    data: {
                        drill: _.inc(0 - num)
                    }
                }).catch(() => false)) {
                    t.rollback(-100)
                }
                if (!await t.collection('users').doc(toId).update({ data: { shell: _.inc(num) } })) {
                    t.rollback(-100)
                }
                if (!await t.collection('posts').doc(postId).update({ data: { shell: _.inc(num) } })) {
                    t.rollback(-100)
                }
                if (!await t.collection('trades').add({ data: { userId: fromId, fromId: toId, shell: num, type: 2, addDate: Date.now() } }).catch(() => false)) {
                    t.rollback(-100)
                }
                if (!await t.collection('trades').add({ data: { userId: toId, fromId: fromId, shell: num, type: 3, addDate: Date.now() } }).catch(() => false)) {
                    t.rollback(-100)
                }
                if (!await t.collection('userNotices').add({ data: { toId, fromId, postId, commentId: null, noticeType: 9, shell: num, senDate: Date.now(), isRead: false } }).catch(() => false)) {
                    t.rollback(-100)
                }
                if (!await t.collection('users').doc(toId).update({ data: { noticeCount: _.inc(1) } }).catch(() => false)) {
                    t.rollback(-100)
                }
            }).then(() => this.success()).catch(() => this.fail())
        }
        return this.fail()
    }
    async convert(data, context) {
        const { num } = data
        const userId = context.OPENID
        const user = await this._get(userId)
        if (user) {
            if (user.shell < num) {
                return this.fail(10030, '玉帛贝不足')
            }
            return await db.runTransaction(async t => {
                if (!await db.collection('users').doc(userId).update({
                    data: {
                        drill: _.inc(num),
                        shell: _.inc(0 - num)
                    }
                }).catch(() => false)) {
                    t.rollback(-1)
                }
                if (!await db.collection('trades').add({ data: { userId, shell: num, type: 1, addDate: Date.now() } }).catch(() => false)) {
                    t.rollback(-2)
                }
            }).then(() => this.success()).catch(() => this.fail())
        }
        return this.fail()
    }
    async getAssets(data, context) {
        return this.success(await this._get(context.OPENID))
    }
    async monetize(data, context) {
        const { num } = data
        const userId = context.OPENID
        const user = await this._get(userId)
        if (user) {
            if (user.shell < num) {
                return this.fail(10030, '玉帛贝不足')
            }
            return await db.runTransaction(async t => {
                if (!await t.collection('users').doc(userid).update({ data: { shell: _.inc(0 - num) } })) {
                    t.rollback(-1)
                }
                if (!await t.collection('trades').add({ data: { userId, shell: num, money: Math.floor(num / 100), state: 0, addDate: Date.now() } }).catch(() => false)) {
                    t.rollback(-2)
                }
            }).then(() => this.success()).catch(() => this.fail())
        }
        return this.fail()
    }
    async tradeLogs(data, context) {
        const { pageIndex, pageSize } = data
        return await db.collection('trades')
        .where({ userId: context.OPENID })
        .orderBy('addDate', 'desc')
        .skip((pageIndex - 1) * pageSize)
        .limit(pageSize)
        .get()
        .then(async res => {
            for (const item of res.data) {
                item.moment = moment(item.addDate).format('MM/DD HH:mm');
                if (item.fromId) {
                    item.user = await this.getUserInfo(item.fromId)
                }
            }
            return this.success(res.data)
        }).catch(() => this.success([]))
    }
    async _get(userId) {
        return await this.getByKey('users', userId, {
            drill: true,
            shell: true
        })
    }
}
module.exports = TipController;