'use strict';

const Controller = require('../baseController');
const moment = require('moment');
moment.locale('zh-cn');
class TipController extends Controller {
    /**
     * 打赏
     */
    async reward() {
        const { toId, postId, num } = this.ctx.request.body
        const fromId = await this.getUserId()
        const _user = await this._get(fromId)
        if (_user) {
            if (_user.drill < num) {
                this.fail(10030, '玉帛币不足')
                return
            }
            const isOk = await this.ctx.model.transaction(async t => {
                if (!await this.decrement('drill', { id: fromId }, num, t, 'User')) {
                    throw Error('打赏者扣除玉帛币出错')
                }
                if (!await this.increment('shell', { id: toId }, num, t, 'User')) {
                    throw Error('接受打赏玉帛贝出错')
                }
                if (!await this.increment('shell', { id: postId }, num, t, 'Post')) {
                    throw Error('帖子累计打赏玉帛贝错误')
                }
                if (!await this.create({ userId: fromId, fromId: toId, shell: num, type: 2 }, t, 'Trade')) {
                    throw Error('记录打赏别人出错')
                }
                if (!await this.create({ userId: toId, fromId: fromId, shell: num, type: 3 }, t, 'Trade')) {
                    throw Error('记录收到打赏出错')
                }
                if (!await this.create({ toId, fromId, postId, commentId: null, noticeType: 9, shell: num }, t, 'UserNotice')) {
                    throw Error('新增用户通知失败')
                }
                if (!await this.increment('noticeCount', { id: toId }, 1, t, 'User')) {
                    throw Error('用户通知计数失败')
                }
            }).then(() => {
                return true
            }).catch(() => {
                return false
            })
            if (isOk) {
                this.success()
                return
            }
        }
        this.fail()
    }
    /**
     * 玉帛贝转换成玉帛钻
     */
    async convert() {
        const { num } = this.ctx.request.body
        const userId = this.user.userId
        const _user = await this._get(userId)
        if (_user) {
            if (_user.shell < num) {
                this.fail(10030, '玉帛贝不足')
                return
            }
            const isOk = await this.ctx.model.transaction(async t => {
                if (!await this.update({
                    drill: _user.drill + num,
                    shell: _user.shell - num
                }, {
                    where: {
                        id: userId
                    },
                    transaction: t
                }, 'User')) {
                    throw Error('转换错误')
                }
                if (!await this.create({ userId, shell: num, type: 1 }, t, 'Trade')) {
                    throw Error('添加交易记录出错')
                }
            }).then(() => {
                return true
            }).catch((err) => {
                console.log(err);

                return false
            })
            if (isOk) {
                this.success()
                return
            }
        }
        this.fail()
    }
    /**
     * 获取个人资产
     */
    async getAssets() {
        return this.success(await this._get(this.user.userId))
    }
    /**
     * 变现
     */
    async monetize() {
        const { num } = this.ctx.request.body
        const userId = this.user.userId
        const user = await this._get(userId)
        if (user) {
            if (user.shell < num) {
                this.fail(10030, '玉帛贝不足')
                return
            }
            const isOk = await this.ctx.model.transaction(async t => {
                if (!await this.decrement('shell', { id: userId }, num, t, 'User')) {
                    throw Error('扣除玉帛贝出错')
                }
                if (!await this.create({ userId, shell: num, money: Math.floor(num / 100), state: 0 }, t, 'Trade')) {
                    throw Error('新增变现记录失败')
                }
            }).then(() => {
                return true
            }).catch(() => {
                return false
            })
            if (isOk) {
                this.success()
                return
            }
        }
        this.fail()
    }
    async tradeLogs() {
        const { pageIndex, pageSize } = this.ctx.request.body
        const items = await this.findAll(null, {
            userId: this.user.userId
        }, [['addDate', 'DESC']], pageIndex, pageSize, 'Trade')
        for (const item of items) {
            item.moment = moment(item.addDate).format('MM/DD HH:mm');
            if (item.fromId) {
                item.user = await this.getUserInfo(item.fromId)
            }
        }
        this.success(items)
    }
    /**
     * 绑定公众号
     */
    async bindingMP() {
        const { code } = this.ctx.params
        const mpObj = await this._getMPUserOpenId(code)
        if (mpObj) {
            const isUp = await this.update({
                gzhId: mpObj.openid
            }, {
                where: {
                    id: this.user.userId
                }
            }, 'User')
            if (isUp) {
                const subscribe = await this._isSubscribe()
                if (subscribe === 1) {
                    this.success()
                    return
                }
            }
        }
        this.fail()
    }
    async _getMPUserOpenId(code) {
        const {
            appid,
            secret,
        } = this.config.yitao;
        const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${
            appid
            }&secret=${
            secret
            }&code=${code}&grant_type=authorization_code`
        return this.ctx.http.get(url).then(obj => {
            if (obj.errcode) {
                return null
            } else {
                return obj
            }
        })
    }
    async _isSubscribe() {
        const user = await this.findByPk(this.user.userId, null, 'User')
        if (user) {
            const token = await this._getMPToken()
            if (token) {
                const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${user.gzhId}&lang=zh_CN`
                const obj = await this.ctx.http.get(url).then(obj => {
                    if (obj && obj.errcode) {
                        this.delKey('MP_ACCESS_TOKEN')
                        return null
                    } else {
                        return obj
                    }
                }).catch(() => {
                    return null
                })
                if (obj) {
                    if (obj.subscribe) {
                        await this.update({
                            subscribe: true
                        }, {
                            where: {
                                id: user.id
                            }
                        }, 'User')
                    }
                    return obj.subscribe
                }
            }
        }
        return -1
    }
    async _getMPToken() {
        const key = 'MP_ACCESS_TOKEN'
        const token = await this.get(key);
        if (token) {
            return token;
        }
        const {
            appid,
            secret,
        } = this.config.yitao;
        const res = await this.ctx.http.get(
            `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${
            appid
            }&secret=${secret}`
        )
        if (res.access_token) {
            await this.set(key, res.access_token, 1.5 * 60 * 60);
            return res.access_token;
        }
        return null
    }
    async _get(userId) {
        return await this.findByPk(userId, ['drill', 'shell'], 'User')
    }
}
module.exports = TipController;