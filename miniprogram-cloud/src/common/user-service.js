import BaseService from "./base-service";
export default class UserService extends BaseService {
    constructor() {
        super()
    }
    async login(shareId) {
        const openid = this.getUserId()
        const user = await this.callFunction('user', 'login', {
            openid,
            shareId
        })
        if (user) {
            user.id = user._id
            wx.setStorageSync('user', user)
            wx.setStorageSync('school', user.school)
            return true
        }
        return false
    }
    async bindInfo({ nickName, avatarUrl, gender, province, city }) {
        const res = await this.callFunction('user', 'bindInfo', { nick: nickName, avtater: avatarUrl, gender, province, city})
        if (res.code === 0) {
            this.showToast('绑定成功', 'success')
            let user = this.getUser()
            if (user) {
                user = Object.assign(user, {
                    nick: nickName, avtater: avatarUrl, isBinding: 1, gender, province, city
                })
                wx.setStorageSync('user', user)
            }
            return true
        }
        this.showToast('绑定失败,重试')
        return false
    }
    async details(id) {
        if (!id) {
            id = this.getUserId()
        }
        const res = await this.callFunction('user', 'details', {id})
        if (res.code === 0) {
            return this.parseUser(res.data)
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
        const res = await this.callFunction('user', 'follow', {toId: id})
        if (res.code === 0) {
            this.showToast('已关注', 'success')
            return true
        }
        this.showToast('关注失败,重试')
        return false
    }
    async cancel(id) {
        const res = await this.callFunction('user', 'cancelFollow', { id })
        if (res.code === 0) {
            this.showToast('取消成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async newData() {
        const res = await this.callFunction('user', 'newData', {})
        if (res.code === 0) {
            res.data.id = res.data._id
            return res.data
        }
        return null
    }
    async searchSchool(keyword, pageIndex, pageSize) {
        const res = await this.callFunction('user', 'searchSchool', {keyword, pageIndex, pageSize})
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async change(filed, value) {
        wx.showLoading({
            title: '保存中...',
            mask: true
        });
        const res = await this.callFunction('user','change', {filed, value})
        wx.hideLoading()
        if (res.code === 0) {
            const user = this.getUser()
            if (user) {
                user[filed] = value
            }
            this.showToast('设置成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async auth(realName, authSrc) {
        wx.showLoading({
            title: '提交中...',
            mask: true
        });
        const res = await this.callFunction('user', 'auth', {realName, authSrc})
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('提交成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async fans({ pageIndex, pageSize, type, userId }) {
        const res = await this.callFunction('user', 'followList', {pageIndex, pageSize, type, userId})
        if (res.code === 0) {
            return res.data.map(this.parseUser.bind(this))
        }
        return null
    }
    async qrCode(postId, commentId) {
        const res = await this.callFunction('user', 'qrCode', { postId, commentId})
        if (res.code === 0) {
            return res.data
        }
        return null
    }
}