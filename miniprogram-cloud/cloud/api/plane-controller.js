const BaseController = require('./base-controller.js')
class PlaneController extends BaseController {
    constructor() {
        super()
    }
    async list(data, context) {
        const { pageIndex, pageSize } = data
        return await db.collection('posts').aggregate().lookup({
            from: 'postViews',
            localField: '_id',
            foreignField: 'postId',
            as: 'views',
        }).unwind({
            path: '$views',
            preserveNullAndEmptyArrays: true
        }).match({
            'views.userId': _.neq(context.OPENID),
            posType: 6
        }).project({
            userId: true,
            content: true
        }).sort({
            'senDate': -1
        })
            .skip((pageIndex - 1) * pageSize)
            .limit(pageSize)
            .end().then(async res => {
                for (const item of res.list) {
                    item.user = await this.getUserInfo(item.userId)
                }
                return this.success(res.list)
            }).catch((err) => this.fail(10001, err.message))
        // return await db.collection('posts').where(_.and([
        //     {
        //         posType: 6
        //     }, {
        //         _id: {
        //             $nin: await db.collection('postViews').where({
        //                 userId: context.OPENID
        //             }).get().then(res => res.data.map(item => {
        //                 return item.postId
        //             })).catch(() => [])
        //         }
        //     }
        // ])).field({
        //     userId: true,
        //     content: true
        // })
        //     .orderBy('senDate', 'desc')
        //     .skip((pageIndex - 1) * pageSize)
        //     .limit(pageSize)
        //     .get().then(async res => {
        //         for (const item of res.data) {
        //             item.user = await this.getUserInfo(item.userId)
        //         }
        //         return this.success(res.data)
        //     }).catch((err) => this.fail(10001, err.message))
    }
    async read(data, context) {
        const { id } = data
        const hasRead = await db.collection('postViews').where(_.and([
            {
                postId: id
            }, {
                userId: context.OPENID
            }
        ])).count().then(res => res.total > 0).catch(() => true)
        if (!hasRead) {
            return await db.collection('postViews').add({
                data: {
                    postId: id,
                    userId: context.OPENID,
                    senDate: Date.now()
                }
            }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
        }
        return this.success()
    }
    async getPlane(data, context) {
        const { id, isSelf } = data
        const post = await this._get(id, isSelf ? context.OPENID : id)
        if (post) {
            post.user = await this.getUserInfo(post.userId)
            return this.success(post)
        }
        return this.fail()
    }
    async addOrUp(data, context) {
        const { content } = data
        if (content) {
            const _err = await cloud.openapi.security.msgSecCheck({
                content
            }).then(res => {
                return res.errCode === 0 ? null : res.errMsg
            }).catch((err) => {
                return err.message
            })
            if (_err) {
                return this.fail(10011, _err);
            }
        }
        let post = await this._get(null, context.OPENID)
        if (post) {
            post.content = context
            return await db.collection('posts').doc(post._id).update({
                data: {
                    content
                }
            }).then(() => this.success(post)).catch((err) => this.fail(err.message))
        } else {
            return await db.collection('posts').add({
                data: {
                    content,
                    posType: 6,
                    userId: context.OPENID,
                    thumbsCount: 0,
                    commentCount: 0,
                    viewCount: 0
                }
            }).then((res) => this.success({
                content,
                userId: context.OPENID,
                id: res._id,
                _id: res._id
            })).catch((err) => this.fail(err.message))
        }
    }
    async remove(data, content) {
        return await db.collection('posts').where(_.and([
            {
                userId: context.OPENID
            }, {
                posType: 6
            }
        ])).remove().then(() => this.success()).catch(() => this.fail())
    }
    async _get(id, userId) {
        if (id) {
            return await db.collection('posts').doc(id).field({
                userId: true,
                content: true
            }).get().then(res => res.data).catch(() => null)
        } else {
            return await db.collection('posts').where(_.and([
                {
                    userId
                },
                {
                    posType: 6
                }
            ])).get().then(res => res.data && res.data[0] || null).catch(() => null)
        }
    }
}
module.exports = PlaneController;