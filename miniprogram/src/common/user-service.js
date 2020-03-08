import BaseService from "./base-service";
import wepy from '@wepy/core'
export default class UserService extends BaseService {
    constructor() {
        super()
    }
    async login(shareId) {
        const userId = this.getUserId()
        let data = null
        if (userId) {
            data = {
                userId
            }
        } else {
            const sys = wx.getSystemInfoSync()
            data = {
                shareId,
                platform: sys.AppPlatform
            }
            let res = await wepy.wx.login()
            if (res && res.code) {
                data.code = res.code
            }
        }
        const res = await this.request('/api/login', data, 'POST')
        if (res.code === 0) {
            const {
                user,
                token
            } = res.data
            wx.setStorageSync('user', user)
            wx.setStorageSync('school', user.school)
            wx.setStorageSync('token', token)
            return true
        }
        return false
    }
    async bindInfo({ nickName, avatarUrl, gender, province, city }) {
        const res = await this.request('/api/user/binding', { nick: nickName, avtater: avatarUrl, gender, province, city }, 'POST')
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
        const res = await this.request(`/api/user/details/${id}`, null, 'GET')
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
        const res = await this.request(`/api/user/follow/${id}`, null, 'GET')
        if (res.code === 0) {
            this.showToast('已关注', 'success')
            return true
        }
        this.showToast('关注失败,重试')
        return false
    }
    async cancel(id) {
        const res = await this.request(`/api/user/follow/cancel/${id}`, null, 'GET')
        if (res.code === 0) {
            this.showToast('取消成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async newData() {
        const res = await this.request('/api/user/refresh', null, 'GET')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async searchSchool(keyword, pageIndex, pageSize) {
        const res = await this.request('/api/user/school', { keyword, pageIndex, pageSize }, 'POST')
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
        const res = await this.request('/api/user/change', { filed, value }, 'POST')
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
        const res = await this.request('/api/user/auth', {
            realName, authSrc
        }, 'POST')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('提交成功', 'success')
            return true
        }
        this.showToast('操作失败,重试')
        return false
    }
    async fans({ pageIndex, pageSize, type, userId }) {
        const res = await this.request('/api/user/fans', { pageIndex, pageSize, type, userId }, 'POST')
        if (res.code === 0) {
            return res.data.map(this.parseUser.bind(this))
        }
        return null
    }
    async send() {
        const res = await this.request('/api/user/send', null, 'GET')
    }
}