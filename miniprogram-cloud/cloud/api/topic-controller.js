const BaseController = require('./base-controller.js')
class TopicController extends BaseController {
    constructor() {
        super()
    }
    async list(data, context) {
        const { keyword, pageIndex, pageSize } = data
        const c = db.collection('topics')
        if (keyword) {
            c = c.where({
                title: db.RegExp({
                    regexp: '.*' + keyword,
                    options: 'i',
                })
            })
        }
        return await c.skip((pageIndex - 1) * pageSize)
            .limit(pageSize).get()
            .then(res => this.success(res.data))
            .catch(() => this.fail([]))
    }
    async listForUser(data, context) {
        const { pageIndex, pageSize, userId } = data
        const items = []
        const _items = await db.collection('topicFollows').where(_.and([
            {
                userId
            }, {
                hasFollow: true
            }
        ])).orderBy('score', 'desc')
            .skip((pageIndex - 1) * pageSize)
            .limit(pageSize)
            .get()
            .then(res => res.data).catch(() => [])
        for (const item of _items) {
            const _topic = await this.getByKey('topics', item.topicId, {})
            if (_topic) {
                items.push(_topic)
            }
        }
        return this.success(items)
    }
    async details(data, context) {
        const { id } = data
        const topic = await this.getByKey('topics', id, {})
        if (topic) {
            topic.hasFollow = await db.collection('topicFollows').where(_.and([
                {
                    userId: context.OPENID
                }, {
                    topicId: id
                }, {
                    hasFollow: true
                }
            ])).count().then(res => res.total > 0).catch(() => false)
            topic.followers = await db.collection('topicFollows').where(_.and([
                {
                    topicId: id
                }, {
                    hasFollow: true
                }
            ])).field({
                userId: true
            }).orderBy('score', 'desc')
                .skip(0)
                .limit(5)
                .get().then(async res => {
                    const users = []
                    for (const item of res.data) {
                        const user = await this.getUserInfo(item.userId)
                        if (user && user.avtater) {
                            users.push(user.avtater)
                        }
                    }
                    return users
                })
            return this.success(topic)
        }
        return this.fail()
    }
    async follow(data, context) {
        const { id } = data
        const res = await db.collection('topicFollows').where(_.and([
            {
                userId: context.OPENID
            }, {
                topicId: id
            }
        ])).get().then(res => res.data && res.data[0] || null).catch(() => null)
        if (res) {
            if (res.hasFollow) {
                return this.success()
            } else {
                if (await db.collection('topicFollows').doc(res._id).update({
                    data: {
                        hasFollow: true
                    }
                }).catch(() => null)) {
                    await db.collection('topics').doc(id).update({
                        data: {
                            followCount: _.inc(1)
                        }
                    })
                    return this.success()
                }
            }
        } else {
            if (await db.collection('topicFollows').add({
                data: {
                    userId: context.OPENID,
                    topicId: id,
                    hasFollow: true,
                    score: 0,
                    followDate: Date.now()
                }
            }).catch(() => null)) {
                await db.collection('topics').doc(id).update({
                    data: {
                        followCount: _.inc(1)
                    }
                })
                return this.success()
            }
        }
        return this.fail()
    }
    async cancelFollow(data, context) {
        const { id } = data
        if (await db.collection('topicFollows').where(_.and([
            {
                topicId: id
            }, {
                userId: context.OPENID
            }
        ])).update({
            data: {
                hasFollow: false
            }
        })) {
            return await db.collection('topics').doc(id).update({
                data: {
                    followCount: _.inc(-1)
                }
            }).then(() => this.success()).catch(() => this.fail())
        }
        return this.fail()
    }
    async add(data, context) {
        const { title, des, iconSrc, nickName } = data
        const user = await this.getUserInfo(context.OPENID)
        if (user && (user.userType === 1 || user.grade === 3)) {
            return await db.runTransaction(async t => {
                const topic = await t.collection('topics').add({
                    data: {
                        title, des, iconSrc, nickName,
                        topicType: user.userType === 1 ? 0 : 1,
                        ownerId: context.OPENID,
                        followCount: 1,
                        postCount: 0,
                        isTop: false,
                        isActivity: false
                    }
                }).catch(() => null)
                if (!topic) {
                    t.rollback(-100)
                }
                if (!await t.collection('topicFollows').add({
                  data: {
                    userId: context.OPENID,
                    topicId: topic._id,
                    hasFollow: true,
                    score: 0,
                    followDate: Date.now()
                  }
                })) {
                    t.rollback(-100)
                }
                return topic
            }).then(obj => {
                return this.success(obj)
            }).catch((err) => this.fail(10001, err.message))
        }
        return this.fail()
    }
}
module.exports = TopicController;