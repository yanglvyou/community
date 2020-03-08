'use strict';

const Controller = require('./baseController');

class TopicController extends Controller {
    get Name() {
        return 'Topic';
    }
    async list() {
        const { keyword, pageIndex, pageSize } = this.ctx.request.body
        let where = null
        if (keyword) {
            where = {
                title: {
                    [this.Op.substring]: keyword
                }
            }
        }
        const items = await this.findAll(['id', 'title', 'iconSrc', 'des', 'nickName', 'followCount', 'postCount', 'isTop', 'isActivity'], where, [['isTop', 'DESC']], pageIndex, pageSize);
        for (const item of items) {
            item.hasFollow = await this._hasFollow(item.id, this.user.userId)
        }
        this.success(items)
    }
    async listForUser() {
        const { pageIndex, pageSize, userId } = this.ctx.request.body
        const items = []
        const _items = await this.findAll(['topicId'], {
            userId,
            hasFollow: true
        }, [['score', 'DESC']], pageIndex, pageSize, 'TopicFollow')
        if (_items) {
            for (const _item of _items) {
                const _topic = await this.findByPk(_item.topicId, null)
                if (_topic) {
                    items.push(_topic)
                }
            }
            this.success(items)
            return
        }
        this.fail()
    }
    async details() {
        const { id } = this.ctx.params
        const key = `topic_${id}`
        let _topic = await this.get(key)
        if (_topic) {
            this.success(_topic)
            return
        }
        _topic = await this.findByPk(id)
        if (_topic) {
            _topic.hasFollow = await this.count({
                userId: this.user.userId,
                topicId: id,
                hasFollow: true
            }, 'TopicFollow') > 0
            _topic.followers = []
            const _items = await this.findAll(['userId'], { topicId: id, hasFollow: true }, [['score', 'DESC']], 1, 5, 'TopicFollow')
            for (const _item of _items) {
                const _user = await this.findByPk(_item.userId, ['avtater'], 'User')
                _topic.followers.push(_user.avtater)
            }
            await this.set(key, _topic, 60)
            this.success(_topic)
            return
        }
        this.fail()
    }
    async follow() {
        const { id } = this.ctx.params
        let userId = await this.getUserId()
        const res = await this.findOne({
            where: {
                userId,
                topicId: id,
            }
        }, 'TopicFollow')
        if (res) {
            if (res.hasFollow) {
                this.success()
                return
            } else {
                if (await this.update({
                    hasFollow: true
                }, {
                    where: {
                        userId,
                        topicId: id,
                    }
                }, 'TopicFollow')) {
                    await this.increment('followCount', { id })
                    this.success()
                    return
                }
            }
        } else {
            if (await this.create({
                userId,
                topicId: id,
                hasFollow: true
            }, null, 'TopicFollow')) {
                await this.increment('followCount', { id })
                this.success()
                return
            }
        }
        this.fail()
    }
    async cancelFollow() {
        const { id } = this.ctx.params
        if (await this.update({
            hasFollow: false
        }, {
            where: {
                userId: this.user.userId,
                topicId: id,
            }
        }, 'TopicFollow')) {
            await this.decrement('followCount', { id })
            this.success()
            return
        }
        this.fail()
    }
    async users() {
        const { topicId, pageIndex, pageSize } = this.ctx.request.body
        const key = `topic_user_${topicId}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (items) {
            this.success(items)
            return
        }
        const _items = await this.findAll(['userId', 'score'], {
            topicId,
            hasFollow: true
        }, [['score', 'DESC']], pageIndex, pageSize)
        if (_items) {
            for (const _item of _items) {
                const _user = await this.getUserInfo(_item.userId)
                if (_user) {
                    _item.user = _user
                    items.push(_item)
                }
            }
            if (_items.length) {
                await this.set(key, _items)
            }
            this.success(_items)
            return
        }
        this.fail()
    }
    async add() {
        const { title, des, iconSrc, nickName } = this.ctx.request.body
        const { userId, userType } = this.user
        const user = await this.getUserInfo(userId)
        if (userType === 1 || (user && user.grade === 3)) {
            const topic = await this.ctx.model.transaction(async t => {
                const _topic = await this.create({
                    title, des, iconSrc, nickName,
                    topicType: userType === 1 ? 0 : 1,
                    ownerId: userId,
                    followCount: 1
                }, t)
                if (!_topic) {
                    throw Error('创建话题失败')
                }
                if (!await this.create({
                    userId,
                    topicId: _topic.id,
                    hasFollow: true
                }, t, 'TopicFollow')) {
                    throw Error('新增关注失败')
                }
                return _topic
            }).then(res => {
                return res
            }).catch(() => {
                return null
            })
            if (topic) {
                this.success(topic)
                return
            }
        }
        this.fail()
    }
    async _hasFollow(topicId, userId) {
        const res = await this.findOne({
            where: {
                userId,
                topicId,
            }
        }, 'TopicFollow')
        return res && res.hasFollow || false
    }
}

module.exports = TopicController;
