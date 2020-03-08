'use strict';
const request = require("request");
const cheerio = require('cheerio');
const moment = require('moment');
moment.locale('zh-cn');
const web = 'https://www.wutuobangxinyougou.com'
const Controller = require('./baseController');

class PostController extends Controller {
    get Name() {
        return 'Post';
    }
    async Release() {
        const { questionId, articleTitle, articleImg, articleHtml, articleDelta, introduction, content, imgs, posType, link, video, audio, topicId, topicTitle, latitude, longitude, address } = this.ctx.request.body
        if (content) {
            const isOk = await this.msgSecCheck(content)
            if (!isOk) {
                this.fail(10011, '动弹内容包含违规文字，请修改后再发布');
                return
            }
        }
        let _userId = await this.getUserId()
        const post = await this.ctx.model.transaction(async t => {
            const _hasFollow = await this.count({
                userId: _userId,
                topicId: topicId,
            }, 'TopicFollow')
            const _post = await this.create({
                userId: _userId,
                isRecommend: this.config.autoRecommend,
                questionId, articleTitle, articleImg, articleHtml, articleDelta, introduction, content, imgs, posType, link, video, audio, topicId, topicTitle, latitude, longitude, address
            }, t)
            if (!_post) {
                throw Error('新增帖子失败')
            }
            if (questionId) {
                const $post = await this.findByPk(questionId, ['userId'])
                if (!$post) {
                    throw Error('问题已经不存在')
                }
                if (!await this.increment('commentCount', {
                    id: questionId
                }, 1, t)) {
                    throw Error('帖子评论计数失败')
                }
                if (!await this.increment('noticeCount', {
                    id: $post.userId
                }, 1, t, 'User')) {
                    throw Error('计数失败')
                }
                if (!await this.create({ toId: $post.userId, fromId: _userId, postId: _post.id, noticeType: 7 }, t, 'UserNotice')) {
                    throw Error('新增用户通知失败')
                }
            } else {
                if (this.config.autoRecommend) {
                    await this.create({
                        postId: _post.id,
                        userId: _userId,
                        posType: posType,
                    }, null, 'PostRecommend')
                }
            }
            if (!await this.increment('postCount', { id: topicId }, 1, t, 'Topic')) {
                throw Error('计数失败')
            }
            if (!_hasFollow) {
                if (!await this.create({
                    userId: _userId,
                    topicId: topicId,
                    score: 10
                }, t, 'TopicFollow')) {
                    throw Error('TopicFollow')
                }
            } else {
                if (!await this.increment('score', { userId: _userId, topicId: topicId }, 5, t, 'TopicFollow')) {
                    throw Error('score')
                }
            }
            return _post
        }).then(obj => {
            return obj
        }).catch((err) => {
            console.log(err);

            return null
        })
        if (post) {
            this.success(post)
            return
        }
        this.fail()
    }
    async analyseUrl() {
        const { url } = this.ctx.request.body
        const article = await new Promise((resolve, reject) => {
            request(url, function (error, response, body) {
                if (!error && (response && response.statusCode === 200)) {
                    const $ = cheerio.load(body);
                    let title = null
                    let imageSrc = null
                    if (/(https):\/\/(mp.weixin.qq.com)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                        title = $('meta[property="twitter:title"]').attr('content')
                        imageSrc = $('meta[property="twitter:image"]').attr('content')
                    } else if (/(https):\/\/(juejin.im)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                        title = $('title').text()
                        imageSrc = $('link[rel="apple-touch-icon"]').attr('href')
                    } else if (/(https):\/\/(www.jianshu.com)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                        title = $('meta[property="og:title"]').attr('content')
                        imageSrc = $('meta[property="og:image"]').attr('content')
                    }
                    if (title) {
                        resolve({
                            title,
                            imageSrc
                        })
                    } else {
                        reject()
                    }
                } else {
                    reject()
                }
            });
        }).then(obj => {
            return obj
        }).catch((err) => {
            console.log(err);

            return null
        })
        if (article) {
            this.success(article)
            return
        }
        this.fail()
    }
    async article() {
        const { url } = this.ctx.params
        if (url) {
            const html = await new Promise((resolve, reject) => {
                request(url, function (error, response, body) {
                    if (!error && (response && response.statusCode === 200)) {
                        const $ = cheerio.load(body);
                        if (/(https):\/\/(mp.weixin.qq.com)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                            const imgs = $('img').toArray()
                            for (const img of imgs) {
                                let src = $(img).attr('data-src')
                                $(img).attr('src', `${web}/api/public/image/${encodeURIComponent(src)}`)
                            }
                        } else if (/(https):\/\/(juejin.im)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                            $('script').remove()
                        } else if (/(https):\/\/(www.jianshu.com)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
                            $('link[rel!="stylesheet"]').remove()
                            $('header').remove()
                            $('footer').remove()
                            $('aside').remove()
                            const p = $('article').parent()
                            p.nextAll().remove()
                            p.parent().removeAttr('class')
                            p.parent().parent().removeAttr('class')
                            const links = $('link[rel="stylesheet"]').toArray()
                            for (const link of links) {
                                let src = $(link).attr('href')
                                if (src) {
                                    $(link).attr('href', `${web}/api/public/image/${encodeURIComponent(src)}`)
                                }
                            }
                            const imgs = $('img').toArray()
                            for (const img of imgs) {
                                let src = $(img).attr('data-original-src')
                                $(img).attr('src', `${web}/api/public/image/${encodeURIComponent('https:' + src)}`)
                            }
                            $('script[src]').remove()
                            // const scripts = $('script[src]').toArray()
                            // for (const script of scripts) {
                            //     let src = $(script).attr('src')
                            //     if (src && src.indexOf('cdn2.jianshu.io') > -1) {
                            //         $(script).attr('src', `${web}/api/public/image/${encodeURIComponent(src)}`)  
                            //     }
                            // }
                        }
                        resolve($.html())
                    } else {
                        reject()
                    }
                })
            }).then(data => {
                return data
            }).catch(() => {
                return null
            });
            if (html) {
                this.ctx.body = html;
            }
        }
    }
    async getImg() {
        const { url } = this.ctx.params
        if (url) {
            const result = await this.ctx.curl(url, {
                streaming: true,
            });
            this.ctx.set(result.headers);
            this.ctx.body = result.res;
        }
    }
    async recommend() {
        /**
         * type: 0:推荐,1:动弹,2:文章,3:问答
         */
        const { pageIndex, pageSize, begin, isRefresh, type } = this.ctx.request.body
        let where = {};
        if (type === 0) {
            where.posType = {
                [this.Op.in]: [0, 1, 2, 3]
            }
        }
        else if (type === 1) {
            where.posType = type - 1
        } else if (type === 2) {
            where.posType = {
                [this.Op.in]: [1, 2]
            }
        } else {
            where.posType = type
        }
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
        const items = []
        const _items = await this.findAll(['postId', 'userId'], where, [['senDate', 'DESC']], pageIndex, pageSize, 'PostRecommend')
        for (const _item of _items) {
            const user = await this.getUserInfo(_item.userId)
            const post = await this._getDetails(_item.postId, { exclude: ['articleHtml', 'articleDelta'] })
            const likers = await this._getLikers(_item.postId)
            const comment = await this._getHotComment(_item.postId)
            items.push({
                user,
                post,
                likers,
                comment
            })
        }
        this.success(items)
    }
    /**
     * 推荐帖子
     */
    async recommendPost() {
        const { id } = this.ctx.params
        const { userType } = this.user
        const _post = await this.findByPk(id, ['id', 'userId', 'posType', 'articleTitle', 'introduction', 'content', 'isRecommend'])
        if (_post && userType === 1) {
            const isUp = await this.ctx.model.transaction(async t => {
                if (_post.isRecommend) {
                    if (! await this.destroy({
                        where: {
                            postId: _post.id
                        },
                        transaction: t
                    }, 'PostRecommend')) {
                        throw Error('删除推荐表失败')
                    }
                    if (!await this.update({
                        isRecommend: false
                    }, {
                        where: {
                            id: _post.id
                        },
                        transaction: t
                    })) {
                        throw Error('取消推荐失败')
                    }
                } else {
                    if (!await this.update({
                        isRecommend: true
                    }, {
                        where: {
                            id: _post.id
                        },
                        transaction: t
                    })) {
                        throw Error('推荐失败')
                    }
                    if (!await this.create({
                        postId: _post.id,
                        userId: _post.userId,
                        posType: _post.posType,
                    }, t, 'PostRecommend')) {
                        throw Error('新增到推荐表失败1')
                    }
                    const _str = _post.articleTitle || _post.introduction || _post.content
                    const _msg = `你的帖子「${_str.substring(0, _str.length > 12 ? 12 : _str.length)}...」已被系统推荐`
                    const message = await this.create({
                        content: _msg,
                        contentType: 0
                    }, t, 'Message')
                    if (!message) {
                        throw Error('新增系统通知失败1')
                    }
                    if (!await this.create({
                        toId: _post.userId,
                        messageId: message.id
                    }, t, 'UserSysMessage')) {
                        throw Error('新增系统通知失败2')
                    }
                    if (!await this.increment('sysMsgCount', {
                        id: _post.userId
                    }, 1, t, 'User')) {
                        throw Error('新增系统通知失败3')
                    }
                }
            }).then(() => {
                return true
            }).catch(() => {
                return false
            })
            if (isUp) {
                this.success()
                return
            }
        }
        this.fail()
    }
    async follow() {
        const { pageIndex, pageSize, begin, isRefresh } = this.ctx.request.body
        let where = {
            posType: {
                [this.Op.in]: [0, 1, 2, 3, 4, 5]
            },
            userId: {
                [this.Op.in]: this.literal(`(select toId from \`user-follows\` where fromId = ${this.user.userId})`),
            },
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
        const items = []
        const _items = await this.findAll({ exclude: ['articleHtml', 'articleDelta'] }, where, [['senDate', 'DESC']], pageIndex, pageSize)
        for (const _item of _items) {
            const user = await this.getUserInfo(_item.userId)
            const likers = await this._getLikers(_item.id)
            const comment = await this._getHotComment(_item.id)
            items.push({
                post: _item,
                user,
                likers,
                comment
            })
        }
        this.success(items)
    }
    async recommendForNew() {
        const userId = this.user.userId
        const key = `post_recommend_for_new_${userId}`
        let _items = await this.get(key)
        if (_items) {
            this.success(_items)
            return
        }
        _items = []
        const _users = await this.ctx.model.query(`SELECT distinct userId FROM \`post-recommends\` as r where not exists(select * from \`user-follows\` as f where f.fromId = ${userId} and f.toId = r.userId) and r.userId != ${userId} LIMIT 0, 10`, {
            raw: true,
            nest: true,
        }).then(res => {
            return res
        }).catch(() => {
            return []
        })
        for (const _u of _users) {
            const user = await this.getUserInfo(_u.userId)
            if (user) {
                const post = await this.findOne({
                    attributes: { exclude: ['articleHtml', 'articleDelta'] },
                    where: {
                        userId: _u.userId
                    }
                })
                if (post) {
                    _items.push({
                        post,
                        user
                    })
                }
            }
        }
        this.success(_items)
    }
    async listForTopic() {
        /**
        * type: 0:最新,1:热门,2:动弹,3:文章,4:问题
        */
        const { id, pageIndex, pageSize, begin, isRefresh, type } = this.ctx.request.body
        let where = {
            topicId: id
        };
        let order = [['senDate', 'DESC']]
        if (type === 0) {
            where.posType = {
                [this.Op.in]: [0, 1, 2, 3]
            }
        }
        else if (type === 1) {
            order = this.literal('hot DESC')
            where.posType = {
                [this.Op.in]: [0, 1, 2, 3]
            }
        }
        else if (type === 2) {
            where.posType = 0
        } else if (type === 3) {
            where.posType = {
                [this.Op.in]: [1, 2]
            }
        } else if (type === 4) {
            where.posType = 3
        }
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
        const items = []
        const _items = await this.findAll(['id', 'userId', 'articleTitle', 'articleImg', 'introduction', 'content', 'imgs', 'posType', 'link', 'video', 'audio', 'topicId', 'topicTitle', 'latitude', 'longitude', 'address', 'thumbsCount', 'commentCount', 'viewCount', [this.literal('thumbsCount + commentCount * 10 + viewCount'), 'hot']], where, order, pageIndex, pageSize)
        for (const _item of _items) {
            const user = await this.getUserInfo(_item.userId)
            const likers = await this._getLikers(_item.id)
            items.push({
                user,
                likers,
                post: _item
            })
        }
        this.success(items)
    }
    async listForUser() {
        /**
         * type: 0:动弹,1:文章,2:问答
         */
        const { id, pageIndex, pageSize, type } = this.ctx.request.body
        let where = {
            userId: id
        };
        if (type === 0) {
            where.posType = {
                [this.Op.in]: [0, 1, 2, 3]
            }
        }
        else if (type === 1) {
            where.posType = {
                [this.Op.in]: [1, 2]
            }
        } else if (type === 2) {
            where.posType = {
                [this.Op.in]: [3, 4]
            }
        } else {
            // where.posType = 0
        }
        const items = []
        const _items = await this.findAll({ exclude: ['articleHtml', 'articleDelta'] }, where, [['senDate', 'DESC']], pageIndex, pageSize)
        for (const _item of _items) {
            const user = await this.getUserInfo(_item.userId)
            const likers = await this._getLikers(_item.id)
            items.push({
                user,
                likers,
                post: _item
            })
        }
        this.success(items)

    }
    async listForSchool() {
        const { pageIndex, pageSize, school, begin, isRefresh } = this.ctx.request.body
        if (!school) {
            this.success([])
            return
        }
        let where = this.literal(`exists(select id from users where school = '${school}' and id = \`post-recommend\`.userId) ${begin ? ` and senDate ${isRefresh ? '>' : '<'} ${begin}` : ''}`);
        const items = []
        const _items = await this.findAll(['postId', 'userId'], where, [['senDate', 'DESC']], pageIndex, pageSize, 'PostRecommend')
        for (const _item of _items) {
            const user = await this.getUserInfo(_item.userId)
            const post = await this._getDetails(_item.postId, { exclude: ['articleHtml', 'articleDelta'] })
            const likers = await this._getLikers(_item.postId)
            const comment = await this._getHotComment(_item.postId)
            items.push({
                user,
                post,
                likers,
                comment
            })
        }
        this.success(items)
    }
    async answers() {
        const { id, pageIndex, pageSize } = this.ctx.request.body
        const key = `answer_${id}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (items) {
            this.success(items)
            return
        }
        items = []
        const _items = await this.findAll({ exclude: ['articleHtml', 'articleDelta'] }, {
            questionId: id
        }, [['senDate', 'DESC']], pageIndex, pageSize)
        if (_items) {
            for (const _item of _items) {
                const user = await this.getUserInfo(_item.userId)
                items.push({
                    post: _item,
                    user
                })
            }
            if (items.length > 0) {
                await this.set(key, items, 60)
            }
            this.success(items)
            return
        }
        this.fail()
    }
    async details() {
        const { id } = this.ctx.params
        const _post = await this._getDetails(id)
        let _hasFollow = false
        if (_post) {
            const _hasLike = await this.count({
                postId: id,
                userId: this.user.userId,
                likeType: 0
            }, 'PostLike')
            const _user = await this.getUserInfo(_post.userId)
            const _topic = await this._getTopic(_post.topicId)
            const _likers = await this._getLikers(_post.id)
            if (_post.userId !== this.user.userId) {
                _hasFollow = await this.count({
                    fromId: this.user.userId,
                    toId: _post.userId
                }, 'UserFollow') > 0
            }
            this.success({
                hasFollow: _hasFollow,
                post: _post,
                hasLike: _hasLike,
                user: _user,
                likers: _likers,
                topic: _topic
            })
            return
        }
        this.fail()
    }
    async comment() {
        const { toId, postId, commentId, commenType, content, imgs } = this.ctx.request.body
        const isOk = await this.msgSecCheck(content)
        if (!isOk) {
            this.fail(10011, '动弹内容包含违规文字，请修改后再发布');
            return
        }
        let fromId = await this.getUserId()
        const _comment = await this.ctx.model.transaction(async t => {
            const obj = await this.create({ fromId, toId, postId, commentId, commenType, content, imgs }, t, 'PostComment')
            if (!obj) {
                throw Error('新增评论失败')
            }
            let isUp = await this.increment('commentCount', {
                id: postId
            }, 1, t)
            if (!isUp) {
                throw Error('帖子评论计数失败')
            }
            if (commenType === 1 || commenType === 2) {
                isUp = await this.increment('replyCount', {
                    id: commentId
                }, 1, t, 'PostComment')
                if (!isUp) {
                    throw Error('评论计数失败')
                }
            }
            if (fromId !== toId) {
                if (!await this.create({ toId, fromId, postId, commentId: obj.id, replyId: commentId, noticeType: commenType }, t, 'UserNotice')) {
                    throw Error('新增用户通知失败')
                }
                isUp = await this.increment('noticeCount', {
                    id: toId
                }, 1, t, 'User')
                if (!isUp) {
                    throw Error('用户通知计数失败')
                }
            }
            return obj
        }).then((obj) => {
            return obj
        }).catch(() => {
            return null
        })
        if (_comment) {
            const _user = await this.getUserInfo(fromId)
            _comment.from = _user
            this.success(_comment)
            await this.delKey(`comment_${postId}`)
            return
        }
        this.fail()
    }
    async like() {
        /**
         * likeType: 0:帖子,1:评论,2:回复
         */
        const { toId, postId, commentId, likeType } = this.ctx.request.body
        let userId = await this.getUserId()
        const _isLike = await this.ctx.model.transaction(async t => {
            const where = {
                fromId: userId,
                likeType
            }
            if (likeType === 0) {
                where.postId = postId
            } else {
                where.commentId = commentId
            }
            const _hasLike = await this.count(where, 'UserNotice')
            let res = await this.create({
                userId, toId, postId, commentId, likeType
            }, t, 'PostLike')
            if (!res) {
                throw Error('点赞失败')
            }
            if (likeType === 0) {
                res = await this.increment('thumbsCount', {
                    id: postId
                }, 1, t)
            } else {
                res = await this.increment('thumbsCount', {
                    id: commentId
                }, 1, t, 'PostComment')
            }
            if (!res) {
                throw Error('点赞计数失败')
            }
            res = await this.increment('thumbsNum', { id: toId }, 1, t, 'User')
            if (!res) {
                throw Error('用户点赞计数失败')
            }
            if (userId !== toId) {
                if (!_hasLike) {
                    if (!await this.create({ toId, fromId: userId, postId, commentId, noticeType: likeType + 3 }, t, 'UserNotice')) {
                        throw Error('新增用户通知失败')
                    }
                    res = await this.increment('noticeCount', {
                        id: toId
                    }, 1, t, 'User')
                    if (!res) {
                        throw Error('用户通知计数失败')
                    }
                }
            }
        }).then(() => {
            return true
        }).catch((err) => {
            console.log(err);

            return false
        })
        if (_isLike) {
            this.success()
            await this.delKey(`comment_${postId}`)
            return
        }
        this.fail()
    }
    async cancelLike() {
        const { likeType, id } = this.ctx.request.body
        const _isCancel = await this.ctx.model.transaction(async t => {
            const _postLike = await this.findByPk(id, ['toId'], 'PostLike')
            if (!_postLike) {
                throw Error('点赞取消失败')
            }
            let isUp = await this.destroy({
                where: {
                    likeType,
                    userId: this.user.userId,
                    [likeType === 0 ? 'postId' : 'commentId']: id
                },
                force: true,
                transaction: t
            }, 'PostLike')
            if (!isUp) {
                throw Error('点赞取消失败')
            }
            isUp = await this.decrement('thumbsCount', {
                id
            }, 1, t, likeType === 0 ? null : 'PostComment')
            if (!isUp) {
                throw Error('点赞递减失败')
            }
            isUp = await this.decrement('thumbsNum', { id: _postLike.toId }, 1, t, 'User')
            if (!isUp) {
                throw Error('用户点赞计数失败')
            }
        }).then(() => {
            return true
        }).catch((err) => {
            console.log(err);

            return false
        })
        if (_isCancel) {
            this.success()
            await this.delKey(`comment_${id}`)
            return
        }
        this.fail()
    }
    async getComments() {
        const { likeType, id, pageIndex, pageSize } = this.ctx.request.body
        const key = `comment_${id}_${likeType}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (!items) {
            items = await this.findAll(null, {
                [likeType === 0 ? 'postId' : 'commentId']: id,
                commenType: likeType === 0 ? likeType : [1, 2]
            }, [['senDate', likeType === 0 ? 'DESC' : 'ASC']], pageIndex, pageSize, 'PostComment')
            for (const _item of items) {
                _item.from = await this.getUserInfo(_item.fromId)
                _item.moment = moment(_item.senDate).fromNow();
                if (likeType !== 0) {
                    _item.to = await this.getUserInfo(_item.toId)
                }
            }
            if (items.length) {
                await this.set(key, items, 60)
            }
        }
        for (const _item of items) {
            _item.hasLike = await this._hasLike(_item.commenType + 1, _item.id)
        }
        this.success(items)
    }
    async getCommentDetails() {
        const { id } = this.ctx.params
        const comment = await this.findByPk(id, null, 'PostComment')
        if (comment) {
            comment.from = await this.getUserInfo(comment.fromId)
            comment.hasLike = await this._hasLike(1, comment.id)
            this.success(comment)
            return
        }
        return this.fail()
    }
    async removePost() {
        const { id } = this.ctx.params
        const { userId, userType } = this.user
        const _post = await this.findByPk(id, ['userId', 'articleTitle', 'introduction', 'content'])
        const isDel = await this.ctx.model.transaction(async t => {
            if (!await this.destroy({
                where: userType === 1 ? { id } : {
                    id,
                    userId: userId
                },
                transaction: t
            })) {
                throw Error('删除帖子失败')
            }
            if (userType === 1) {
                const _str = _post.articleTitle || _post.introduction || _post.content
                const _msg = `你的帖子「${_str.substring(0, _str.length > 12 ? 12 : _str.length)}...」已被系统删除`
                const message = await this.create({
                    content: _msg,
                    contentType: 0
                }, t, 'Message')
                if (!message) {
                    throw Error('新增系统通知失败1')
                }
                if (!await this.create({
                    toId: _post.userId,
                    messageId: message.id
                }, t, 'UserSysMessage')) {
                    throw Error('新增系统通知失败2')
                }
                if (!await this.increment('sysMsgCount', {
                    id: _post.userId
                }, 1, t, 'User')) {
                    throw Error('新增系统通知失败3')
                }
            }
            if (!await this.destroy({
                where: {
                    postId: id,
                    userId: userId
                },
                transaction: t
            }, 'PostRecommend')) {
                throw Error('删除推荐帖子失败')
            }
        }).then(() => {
            return true
        }).catch(() => {
            return false
        })
        if (isDel) {
            this.success()
            return
        }
        this.fail()
    }
    async removeComment() {
        const { id } = this.ctx.params
        const { userId, userType } = this.user
        const _comment = await this.findByPk(id, ['content', 'fromId'], 'PostComment')
        const isDel = await this.ctx.model.transaction(async t => {
            if (!await this.destroy({
                where: userType === 1 ? {
                    id
                } : {
                        id,
                        fromId: userId
                    },
                transaction: t
            }, 'PostComment')) {
                throw Error('删除评论失败')
            }
            if (userType === 1) {
                console.log(_comment);

                const _msg = `你的评论「${_comment.content}」已被系统删除`
                const message = await this.create({
                    content: _msg,
                    contentType: 0
                }, t, 'Message')
                if (!message) {
                    throw Error('新增系统通知失败1')
                }
                if (!await this.create({
                    toId: _comment.fromId,
                    messageId: message.id
                }, t, 'UserSysMessage')) {
                    throw Error('新增系统通知失败2')
                }
                if (!await this.increment('sysMsgCount', {
                    id: _comment.fromId
                }, 1, t, 'User')) {
                    throw Error('新增系统通知失败3')
                }
            }
        }).then(() => {
            return true
        }).catch((err) => {
            console.log(err);

            return false
        })
        if (isDel) {
            this.success()
            return
        }
        this.fail()
    }
    /**
     * 设置热评
     */
    async hotComment() {
        const { id } = this.ctx.params
        const { userType } = this.user
        const _comment = await this.findByPk(id, ['id', 'content', 'fromId', 'isHot'], 'PostComment')
        if (_comment && userType === 1) {
            const isUp = await this.ctx.model.transaction(async t => {
                if (_comment.isHot) {
                    if (!await this.update({
                        isHot: false
                    }, {
                        where: {
                            id: _comment.id
                        },
                        transaction: t
                    }, 'PostComment')) {
                        throw Error('取消热评失败')
                    }
                } else {
                    if (!await this.update({
                        isHot: true
                    }, {
                        where: {
                            id: _comment.id
                        },
                        transaction: t
                    }, 'PostComment')) {
                        throw Error('推荐失败')
                    }
                    const _msg = `你的评论「${_comment.content}」已被系统选为热评`
                    const message = await this.create({
                        content: _msg,
                        contentType: 0
                    }, t, 'Message')
                    if (!message) {
                        throw Error('新增系统通知失败1')
                    }
                    if (!await this.create({
                        toId: _comment.fromId,
                        messageId: message.id
                    }, t, 'UserSysMessage')) {
                        throw Error('新增系统通知失败2')
                    }
                    if (!await this.increment('sysMsgCount', {
                        id: _comment.fromId
                    }, 1, t, 'User')) {
                        throw Error('新增系统通知失败3')
                    }
                }
            }).then(() => {
                return true
            }).catch((err) => {
                console.log(err);

                return false
            })
            if (isUp) {
                this.success()
                return
            }
        }
        this.fail()
    }
    async commentForUser() {
        const { pageIndex, pageSize } = this.ctx.params
        const key = `Comment_User_${this.user.userId}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (items) {
            this.success(items)
            return
        }
        items = []
        const _items = await this.findAll(null, {
            fromId: this.user.userId,
            commenType: [0, 1, 2]
        }, [['senDate', 'DESC']], parseInt(pageIndex), parseInt(pageSize), 'PostComment')
        if (_items) {
            for (const _item of _items) {
                const obj = {
                    comment: _item
                }
                if (_item.commenType === 2) {
                    obj.to = await this.getUserInfo(_item.toId)
                }
                obj.user = await this.getUserInfo(_item.fromId)
                if (_item.commentId) {
                    obj.originComment = await this.findByPk(_item.commentId, null, 'PostComment')
                } else {
                    obj.post = await this.findByPk(_item.postId, ['id', 'introduction', 'content', 'imgs', 'posType'])
                }
                items.push(obj)
            }
            if (items.length) {
                await this.set(key, items, 60)
            }
            this.success(items)
            return
        }
        this.fail()
    }
    async likeForUser() {
        const { pageIndex, pageSize } = this.ctx.params
        const key = `Like_User_${this.user.userId}_${pageIndex}_${pageSize}`
        let items = await this.get(key)
        if (items) {
            this.success(items)
            return
        }
        items = []
        const _items = await this.findAll(null, {
            userId: this.user.userId,
            likeType: [0]
        }, [['senDate', 'DESC']], parseInt(pageIndex), parseInt(pageSize), 'PostLike')
        for (const _item of _items) {
            let obj = null
            if (_item.commentId) {
                obj = await this.findByPk(_item.commentId, null, 'PostComment')
                obj.dataType = 1
                obj.from = await this.getUserInfo(_item.toId)
            } else {
                obj = {
                    dataType: 0
                }
                obj.user = await this.getUserInfo(_item.toId)
                obj.post = await this.findByPk(_item.postId, { exclude: ['articleHtml', 'articleDelta'] })
            }
            items.push(obj)
        }
        if (items.length) {
            await this.set(key, items, 60)
            this.success(items)
            return
        }
        this.fail()
    }
    async _getDetails(id, attributes = null) {
        const key = attributes ? `post_item_${id}` : `post_${id}`
        let _post = await this.get(key)
        if (_post) {
            return _post
        } else {
            _post = await this.findByPk(id, attributes)
            if (_post) {
                await this.set(key, _post, 60)
                return _post
            } else {
                return null
            }
        }
    }
    async _getTopic(id) {
        const key = `topic_${id}`
        let _topic = await this.get(key)
        if (_topic) {
            return _topic
        } else {
            _topic = await this.findByPk(id, ['id', 'title', 'iconSrc', 'nickName', 'followCount', 'postCount'], 'Topic')
            if (_topic) {
                await this.set(key, _topic, 60)
                return _topic
            } else {
                return null
            }
        }
    }
    async _getLikers(postId) {
        const key = `post_liker_${postId}`
        let _likers = await this.get(key)
        if (_likers) {
            return _likers
        } else {
            _likers = []
            const _items = await this.findAll(['userId'], {
                postId: postId,
                likeType: 0
            }, [['senDate', 'DESC']], 1, 5, 'PostLike')
            for (const _item of _items) {
                const _user = await this.getUserInfo(_item.userId)
                if (_user) {
                    _likers.push(_user.avtater)
                }
            }
            if (_likers.length) {
                await this.set(key, _likers, 60)
                return _likers
            }
        }
        return null
    }
    async _getHotComment(postId) {
        const key = `post_hot_comment_${postId}`
        let comment = await this.get(key)
        if (comment) {
            return comment
        } else {
            comment = await this.findOne({
                attributes: ['fromId', 'content', 'imgs'],
                where: {
                    postId,
                    commenType: 0,
                    isHot: true
                }
            }, 'PostComment')
            if (comment) {
                const user = await this.getUserInfo(comment.fromId)
                if (user) {
                    comment.user = user
                    await this.set(key, comment, 60)
                    return comment
                }
            }
        }
        return null
    }
    async _hasLike(likeType, id) {
        return this.count({
            likeType: likeType === 0 ? 0 : [1, 2],
            userId: this.user.userId,
            [likeType === 0 ? 'postId' : 'commentId']: id
        }, 'PostLike')
    }
}

module.exports = PostController;
