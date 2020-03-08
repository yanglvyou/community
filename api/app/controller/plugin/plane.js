'use strict';

const Controller = require('../baseController');

class PlaneController extends Controller {
    async list() {
        const { pageIndex, pageSize } = this.ctx.params
        const where = this.literal(` posType = 6 and not exists(select * from \`post-views\` as v where v.postId = post.id and v.userId = ${this.user.userId}) `)
        const _items = await this.findAll(['id', 'userId', 'content'], where, [['senDate', 'DESC']], parseInt(pageIndex), parseInt(pageSize), 'Post')
        for (const _item of _items) {
            _item.user = await this.getUserInfo(_item.userId)
        }
        this.success(_items)
    }
    async read() {
        const { id } = this.ctx.params
        const _hasRead = await this.count({
            postId: id,
            userId: this.user.userId
        }, 'PostView') > 0
        if (!_hasRead) {
            await this.create({
                postId: id,
                userId: this.user.userId
            }, null, 'PostView')
        }
        this.success()
    }
    async getPlane() {
        const { id, isSelf } = this.ctx.request.body
        const _post = await this._get(isSelf ? this.user.userId : id, isSelf)
        if (_post) {
            _post.user = await this.getUserInfo(_post.userId)
            this.success(_post)
            return
        }
        this.fail()
    }
    async addOrUp() {
        const { content } = this.ctx.request.body
        let userId = await this.user.userId
        if (this.user.userType === 1) {
            const _user = await this.randomUser()
            if (_user) {
                userId = _user.id
            }
        }
        if (content) {
            const isOk = await this.msgSecCheck(content)
            if (!isOk) {
                this.fail(10011, '动弹内容包含违规文字，请修改后再发布');
                return
            }
            let _post = await this._get(userId, true)
            if (_post) {
                if (await this.update({
                    content
                }, {
                    where: {
                        userId,
                        posType: 6,
                    }
                }, 'Post')) {
                    _post.content = content
                    this.success(_post)
                    return
                }
            }
            _post = await this.create({
                content,
                posType: 6,
                userId: this.user.userId
            }, null, 'Post')
            if (_post) {
                this.success(_post)
                return
            }
        }
        this.fail()
    }
    async remove() {
        if (await this.destroy({
            where: {
                userId: this.user.userId,
                posType: 6,
            }
        }, 'Post')) {
            this.success()
            return
        }
        this.fail()
    }
    async _get(id, isSelf = false) {
        return await this.findOne({
            attributes: ['id', 'userId', 'content'],
            where: isSelf ? {
                userId: id,
                posType: 6,
            } : {
                    id
                }
        }, 'Post')
    }
}
module.exports = PlaneController;