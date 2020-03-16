import BaseService from "./base-service";
const KEY_TOPIC_TRACK = 'TOPIC_TRACK'
export default class TopicService extends BaseService {
    constructor() {
        super()
    }
    async searchTopic({ keyword, pageIndex, pageSize }) {
        const res = await this.callFunction('topic', 'list', {
            keyword, pageIndex, pageSize
        })
        if (res.code === 0) {
            return res.data.map(topic => {
                return this.parseTopic(topic)
            })
        }
        return []
    }
    async getListForUser({ pageIndex, pageSize, userId = null }) {
        if (!userId) {
            userId = this.getUserId()
        }
        const res = await this.callFunction('topic', 'listForUser', { pageIndex, pageSize, userId })
        if (res.code === 0) {
            return res.data.map(this.parseTopic.bind(this))
        }
        return null
    }
    async getDetails(id) {
        const res = await this.callFunction('topic', 'details', { id })
        if (res.code === 0 && res.data) {
            const bg = await this.getTempFileURL(res.data.iconSrc)
            res.data.bg = bg
            return this.parseTopic(res.data)
        }
        return null
    }
    async follow(id) {
        if (!this.isBinding()) {
            wx.navigateTo({
                url: '/pages/gender'
            });
            return
        }
        const res = await this.callFunction('topic', 'follow', { id })
        if (res.code === 0) {
            this.showToast('已关注', 'success')
            return true
        }
        this.showToast('关注失败,重试')
        return false
    }
    async cancel(id) {
        const res = await this.callFunction('topic', 'cancelFollow', { id })
        if (res.code === 0) {
            this.showToast('取消成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async users({ topicId, pageIndex, pageSize }) {
    }
    async add({ title, des, iconSrc, nickName }) {
        wx.showLoading({
            title: '创建中...',
            mask: true
        });
        const res = await this.callFunction('topic', 'add', {
            title, des, iconSrc, nickName
        })
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('已创建成功', 'success')
            return res.data
        }
        this.showToast('创建失败,重试')
        return null
    }
    topicAddTrack(topic) {
        try {
            let items = wx.getStorageSync(KEY_TOPIC_TRACK)
            if (items) {
                items = items.filter(item => {
                    return item.id !== topic.id
                })
                items.unshift(topic)
                if (items.length > 15) {
                    items = items.slice(0, 15)
                }
            } else {
                items = [topic]
            }
            try {
                wx.setStorageSync(KEY_TOPIC_TRACK, items)
            } catch (e) { }
        } catch (e) {
            console.log(e);
        }
    }
    getTopicTrack() {
        try {
            let items = wx.getStorageSync(KEY_TOPIC_TRACK)
            return items || null
        }
        catch (e) {
            return null
        }
    }
    cleanTopicTrack() {
        try {
            wx.removeStorageSync(KEY_TOPIC_TRACK)
            return true
        } catch (e) {
            showToast('清空数据失败,重试')
            return false
        }
    }
}