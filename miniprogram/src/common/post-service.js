import BaseService from "./base-service";
export default class PostService extends BaseService {
    constructor() {
        super()
        this.userId = this.getUserId()
        this.userType = this.getUserType()
    }
    async release(post) {
        const res = await this.request('/api/post/release', post, 'POST')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('成功发布', 'success')
            return true
        } else {
            let title = '发布失败,重试'
            if (res.erroCode > 0) {
                title = res.msg
            }
            this.showToast(title)
        }
        return false
    }
    async analyse(url) {
        if (!url) {
            return
        }
        const res = await this.request('/api/post/analyse', { url }, 'POST')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    /**
     * 推荐
     * @param {pageIndex, pageSize, begin, isRefresh, type} options 
     * type: 0:推荐,1:动弹,2:文章,3:问答
     */
    async recommend(options) {
        return await this._list('/api/post/recommend', options)
    }
    async listForTopic(options) {
        return await this._list('/api/topic/post/list', options)
    }
    async listForUser(options) {
        return await this._list('/api/post/list/user', options)
    }
    async listForSchool(options) {
        options.school = this.getSchool()
        return await this._list('/api/post/list/school', options)
    }
    /**
     * 关注动态
     * @param {pageIndex, pageSize, begin, isRefresh} options 
     */
    async follow(options) {
        return await this._list('/api/post/follow', options)
    }
    async recommendForNew() {
        return await this._list('/api/post/recommend/new', null, 'GET')
    }
    async answers(id, pageIndex, pageSize) {
        return this._list('/api/post/answers', { id, pageIndex, pageSize })
    }
    async details(id) {
        const res = await this.request(`/api/post/details/${id}`, null, 'GET')
        if (res.code === 0) {
            return this._parsePost(res.data)
        }
        return null
    }
    /**
     * 
     * @param {commenType:0:帖子,1:评论,2:回复} param0 
     */
    async comment({ toId, postId, commentId, commenType, content, imgs }) {
        if (!this.isBinding()) {
            wx.navigateTo({
                url: '/pages/gender'
            });
            return
        }
        const res = await this.request('/api/post/comment', { toId, postId, commentId, commenType, content, imgs }, 'POST')
        wx.hideLoading()
        if (res.code === 0 && res.data) {
            this.showToast('成功发表', 'success')
            return this._parseComment(res.data)
        }
        this.showToast('发表失败,重试')
        return null
    }
    async like(toId, postId, commentId, likeType) {
        if (!this.isBinding()) {
            wx.navigateTo({
                url: '/pages/gender'
            });
            return
        }
        wx.showLoading({
            title: '点赞中...',
            mask: true
        });
        const res = await this.request('/api/post/like', { toId, postId, commentId, likeType }, 'POST')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('点赞成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async cancelLike(likeType, id) {
        wx.showLoading({
            title: '取消中...',
            mask: true
        });
        const res = await this.request('/api/post/like/cancel', { likeType, id }, 'POST')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('取消成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async getComments({ likeType, id, pageIndex, pageSize }) {
        const res = await this.request('/api/post/comment/list', { likeType, id, pageIndex, pageSize }, 'POST')
        if (res.code === 0) {
            return res.data.map(this._parseComment.bind(this))
        }
        return null
    }
    async getCommentDetail(id) {
        const res = await this.request(`/api/post/comment/get/${id}`, null, 'GET')
        if (res.code === 0 && res.data) {
            return this._parseComment(res.data)
        }
        return null
    }
    async removePost(id) {
        wx.showLoading({
            title: '删除中...',
            mask: true
        });
        const res = await this.request(`/api/post/remove/${id}`, null, 'GET')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('已删除', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async removeComment(id) {
        wx.showLoading({
            title: '删除中...',
            mask: true
        });
        const res = await this.request(`/api/post/comment/remove/${id}`, null, 'GET')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('已删除', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async commentsForUser({ pageIndex, pageSize }) {
        const res = await this.request(`/api/post/user/comment/list/${pageIndex}/${pageSize}`)
        if (res.code === 0) {
            return res.data.map(item => {
                if (item.user) {
                    item.user = this.parseUser(item.user)
                }
                if (item.originComment) {
                    item.originComment = this._parseComment(item.originComment)
                }
                if (item.post && item.post.imgs) {
                    item.post.imgs = item.post.imgs.map(img => {
                        const path = img.path
                        img.path = this.getQiniuUrl() + path
                        img.thumbPath = this.getQiniuUrl() + 'thumb_' + path
                        return img
                    })
                }
                if (item.comment) {
                    item.comment = this._parseComment(item.comment)
                }
                return item
            })
        }
        return null
    }
    async setPostRecommend(id) {
        wx.showLoading({
            title: '设置中...',
            mask: true
        });
        const res = await this.request(`/api/post/recommend/post/${id}`)
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async setCommentHot(id) {
        wx.showLoading({
            title: '设置中...',
            mask: true
        });
        const res = await this.request(`/api/post/comment/hot/${id}`)
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async likesForUser({ pageIndex, pageSize }) {
        const res = await this.request(`/api/post/user/like/list/${pageIndex}/${pageSize}`)
        if (res.code === 0) {
            return res.data.map(item => {
                if (item.dataType === 1) {
                    item = this._parseComment(item)
                } else {
                    item = this._parsePost(item)
                }
                return item
            })
        }
        return null
    }
    async _list(url, options, method = 'POST') {
        const res = await this.request(url, options, method)
        if (res.code === 0) {
            return res.data.map(this._parsePost.bind(this))
        }
        return null
    }
    _parseComment(item) {
        // item.userType = this.getUserType()
        item.isSys = this.userType === 1
        if (item.from) {
            item.from = this.parseUser(item.from)
            item.isSelf = item.from.id === this.userId
        }
        if (item.content) {
            item.baseTxt = item.content
            item.content = this.parseEmoji(item.content)
        }
        if (item.imgs) {
            item.imgs = item.imgs.map(img => {
                const path = img.path
                img.path = this.getQiniuUrl() + path
                img.thumbPath = this.getQiniuUrl() + 'thumb_' + path
                return img
            })
        }
        return item
    }
    _parsePost(item) {
        // item.userType = this.getUserType()
        item.isSys = this.userType === 1
        if (item.user) {
            item.isSelf = this.userId === item.user.id
            item.user = this.parseUser(item.user)
        }
        if (item.post && item.post.content && item.post.posType !== 3) {
            item.post.baseTxt = item.post.content
            item.post.content = this.parseEmoji(item.post.content)
        }
        if (item.topic) {
            item.topic = this.parseTopic(item.topic)
        }
        if (item.post && item.post.imgs) {
            item.post.imgs = item.post.imgs.map(img => {
                const path = img.path
                img.path = this.getQiniuUrl() + path
                img.thumbPath = this.getQiniuUrl() + 'thumb_' + path
                return img
            })
        }
        return item
    }
}