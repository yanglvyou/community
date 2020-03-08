'use strict';

const Controller = require('./baseController');
const jwt = require('jsonwebtoken');
const constellation = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座'];
const constellationDate = [
    [
        [1, 21],
        [2, 19],
    ],
    [
        [2, 20],
        [3, 20],
    ],
    [
        [3, 21],
        [4, 20],
    ],
    [
        [4, 21],
        [5, 21],
    ],
    [
        [5, 22],
        [6, 21],
    ],
    [
        [6, 22],
        [7, 22],
    ],
    [
        [7, 23],
        [8, 23],
    ],
    [
        [8, 24],
        [9, 23],
    ],
    [
        [9, 24],
        [10, 23],
    ],
    [
        [10, 24],
        [11, 22],
    ],
    [
        [11, 23],
        [12, 21],
    ],
    [
        [12, 22],
        [1, 20],
    ],
];

class UserController extends Controller {
    get Name() {
        return 'User';
    }
    async login() {
        const { code, shareId, platform } = this.ctx.request.body
        const { userId } = this.user || {}
        let _user = null
        if (userId) {
            _user = await this.findByPk(userId)
        } else {
            let _session = {}
            if (platform === 'qq') {
                _session = await this.qqcode2Session(code)
            } else {
                _session = await code2Session.call(this, code)
            }
            if (_session) {
                _user = await this.findOne({
                    where: {
                        openId: _session.openid
                    }
                })
                if (!_user) {
                    _user = await this.create({
                        shareId,
                        platform,
                        openId: _session.openid,
                        unionid: _session.unionid
                    })
                }
            }
        }
        if (_user) {
            this.success({
                user: {
                    userId: _user.id,
                    openId: _user.openId,
                    subscribe: _user.subscribe,
                    nick: _user.nick,
                    avtater: _user.avtater,
                    isBinding: _user.isBinding,
                    userType: _user.userType,
                    isAuth: _user.isAuth,
                    school: _user.school,
                    grade: _user.grade,
                    sysMsgCount: _user.sysMsgCount,
                    noticeCount: _user.noticeCount
                },
                token: jwt.sign({
                    userType: _user.userType,
                    userId: _user.id
                }, this.ctx.app.config.secret),
            })
            return
        }
        this.fail()
        async function code2Session(code) {
            const {
                appid,
                secret,
            } = this.config.miniprogram;
            return await this.ctx.http.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
                .then(res => {
                    if (res.openid) {
                        return {
                            openid: res.openid,
                            unionid: res.unionid,
                        };
                    }
                    return null;
                }).catch(() => {
                    return null;
                });
        }
    }
    async bindInfo() {
        const { nick, avtater, gender, province, city } = this.ctx.request.body
        const _isUp = await this.update({ nick, avtater, gender, province, city, isBinding: true }, {
            where: {
                id: this.user.userId
            }
        })
        if (_isUp) {
            this.success()
            return
        }
        this.fail()
    }
    async details() {
        const { id } = this.ctx.params
        const _user = await this.findByPk(id, { exclude: ['sysMsgCount', 'noticeCount', 'openId', 'unionid', 'shareId', 'gzhId'] })
        if (_user) {
            const userId = this.user.userId
            _user.isSelf = parseInt(id) === userId
            if (parseInt(id) !== userId) {
                _user.hasFollow = await this.count({
                    fromId: userId,
                    toId: id
                }, 'UserFollow') > 0
            }
            this.success(_user)
            return
        }
        this.fail()
    }
    async follow() {
        const { id } = this.ctx.params
        let userId = await this.getUserId()
        const isFollow = await this.ctx.model.transaction(async t => {
            const _hasFollow = await this.count({
                toId: id, fromId: userId, noticeType: 6
            }, 'UserNotice') > 0
            if (await this.count({
                fromId: userId,
                toId: id
            }, 'UserFollow')) {
                return true
            }
            let isUp = await this.create({
                fromId: userId,
                toId: id
            }, t, 'UserFollow')
            if (!isUp) {
                throw Error('新增关注记录失败')
            }
            isUp = await this.increment('followNum', { id: userId }, 1, t)
            if (!isUp) {
                throw Error('失败1')
            }
            isUp = await this.increment(_hasFollow ? 'fansNum' : ['fansNum', 'noticeCount'], { id: id }, 1, t)
            if (!isUp) {
                throw Error('失败2')
            }
            if (!_hasFollow) {
                const _user = this.getUserInfo(id)
                if (_user) {
                    this.send(_user.openId)
                }
                isUp = await this.create({
                    toId: id, fromId: userId, noticeType: 6
                }, t, 'UserNotice')
                if (!isUp) {
                    throw Error('新增用户通知失败')
                }
            }
            return true
        }).then(() => {
            return true
        }).catch(() => {
            return false
        })
        if (isFollow) {
            this.success()
            return
        }
        this.fail()
    }
    async cancelFollow() {
        const { id } = this.ctx.params
        const userId = this.user.userId
        const isCancel = await this.ctx.model.transaction(async t => {
            let isUp = await this.destroy({
                where: {
                    fromId: userId,
                    toId: id
                }
            }, 'UserFollow')
            if (!isUp) {
                throw Error()
            }
            isUp = await this.decrement('followNum', { id: userId }, 1, t)
            if (!isUp) {
                throw Error()
            }
            isUp = await this.decrement('fansNum', { id: id }, 1, t)
            if (!isUp) {
                throw Error()
            }
        }).then(() => {
            return true
        }).catch((err) => {
            console.log(err);

            return false
        })
        if (isCancel) {
            this.success()
            return
        }
        this.fail()
    }
    async newData() {
        const user = await this.findByPk(this.user.userId, ['id', 'nick', 'avtater', 'isBinding', 'isAuth', 'sysMsgCount', 'noticeCount', 'followNum', 'fansNum', 'thumbsNum', 'shell', 'drill'])
        if (user) {
            this.success(user)
            return
        }
        this.fail()
    }
    async searchSchool() {
        const { keyword, pageIndex, pageSize } = this.ctx.request.body
        const items = await this.findAll(null, {
            name: {
                [this.Op.substring]: keyword
            }
        }, null, pageIndex, pageSize, 'School')
        this.success(items)
    }
    async change() {
        const { filed, value } = this.ctx.request.body;
        const user = {
            [filed]: value,
        };
        if (filed === 'birthday') {
            const date = new Date(value);
            const m = date.getMonth() + 1;
            const d = date.getDate();
            let index = -1;
            for (let i = 0; i < constellationDate.length; i++) {
                const e = constellationDate[i];
                if ((m === e[0][0] && d >= e[0][1]) || (m === e[1][0] && d <= e[1][1])) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                user.constellation = constellation[index];
            }
        }
        if (filed === 'hometown') {
            const arr = value.split(' ');
            user.province = arr[0];
            user.city = arr[1];
        }
        if (await this.update(user, {
            where: {
                id: this.user.userId
            }
        })) {
            this.success()
            return
        }
        this.fail()
    }
    async followList() {
        /**
         * type:0:关注的，1:粉丝
         */
        const { pageIndex, pageSize, type, userId } = this.ctx.request.body
        // const userId = await this.user.userId()
        const key = `${userId}_${type}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (items) {
            this.success(items)
            return
        }
        items = []
        const where = {}
        where[type === 0 ? 'fromId' : 'toId'] = userId
        const _items = await this.findAll(null, where, [['followDate', 'DESC']], pageIndex, pageSize, 'UserFollow')
        if (_items) {
            for (const _item of _items) {
                const user = await this.getUserInfo(_item[type === 0 ? 'toId' : 'fromId'])
                if (user) {
                    items.push(user)
                }
            }
            if (items.length) {
                await this.set(key, items, 60)
            }
            this.success(items)
            return
        }
        this.fail()
    }
    async qqcode2Session(code) {
        const {
          appid,
          secret,
        } = this.config.qqminiprogram;
        console.log(code);
    
        //https://api.q.qq.com
        return await this.ctx.http.get(`https://api.q.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
          .then(res => {
            console.log(res);
    
            if (res.openid) {
              return {
                openid: res.openid,
                unionid: res.unionid,
              };
            }
            return null;
          }).catch(() => {
            return null;
          });
      }
    async auth() {
        const { realName, authSrc } = this.ctx.request.body
        const isUp = await this.update({
            realName, authSrc
        }, {
            where: {
                id: this.user.userId
            }
        })
        if (isUp) {
            this.success()
            return
        }
        this.fail()
    }
    async getQrCode() {
        const { userId, postId, commentId } = this.ctx.params;
        const token = await this.getToken();
        if (token) {
            const result = await this.ctx.curl(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    width: 144,
                    scene: commentId === '0' ? `id=${userId}&postId=${postId}` : `id=${userId}&postId=${postId}&commentId=${commentId}`,
                    page: 'pages/index',
                })
            });
            this.ctx.set({
                'content-type': 'application/octet-stream'
            });
            this.ctx.body = result.data;
        }
    }
}

module.exports = UserController;
