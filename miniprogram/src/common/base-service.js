import wepy from '@wepy/core'
const prefix = ''
export const baseUrl = 'https://www.wutuobangxinyougou.com' + prefix
export const baseImgUrl = 'https://www.wutuobangxinyougou.com'
// export const baseUrl = 'http://127.0.0.1:7001' + prefix
export const qiniuUrl = 'http://img.wutuobangxinyougou.com/'
export const imgUrl = baseImgUrl + '/public/images'
const genders = ['未知', '男', '女']
import weibo from './weibo-emotions';
let _height = 0
let _statusBarHeight = 0
let _headHeight = 0
const weibo_icon_url = weibo.weibo_icon_url
const emotions = weibo.emotions
export const eventHub = new wepy();
export const weibo_emojis = (function () {
    const _emojis = {}
    for (const key in emotions) {
        if (emotions.hasOwnProperty(key)) {
            const ele = emotions[key];
            for (const item of ele) {
                _emojis[item.value] = {
                    id: item.id,
                    value: item.value,
                    icon: item.icon.replace('/', '_'),
                    url: weibo_icon_url + item.icon
                }
            }
        }
    }
    return _emojis
})()
export const appUpdate = () => {
    const updateManager = wx.getUpdateManager()
    console.log(updateManager);

    updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate)
    })
    updateManager.onUpdateReady(function () {
        wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success(res) {
                if (res.confirm) {
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    updateManager.applyUpdate()
                }
            }
        })
    })

    updateManager.onUpdateFailed(function () {
        // 新版本下载失败
        showToast('新版本下载失败')
    })
}
export default class BaseService {
    constructor() {
        try {
            if (_height === 0) {
                let res = wx.getSystemInfoSync()
                const { screenHeight, pixelRatio, statusBarHeight } = res
                _height = screenHeight * pixelRatio
                _statusBarHeight = statusBarHeight
                res = wx.getMenuButtonBoundingClientRect();
                if (res) {
                    const { bottom, top } = res;
                    _headHeight = bottom + top - statusBarHeight
                }
            }
        } catch (error) {
            console.log(error);

        }
    }
    showToast(title = '操作失败,重试', icon = 'none') {
        wx.showToast({
            title,
            icon,
            duration: 2000
        })
    }
    isQQ() {
        const sys = wx.getSystemInfoSync();
        if (sys.AppPlatform && sys.AppPlatform === 'qq') {
            return true
        }
        return false
    }
    parseEmoji(txt) {
        if (!txt) {
            return ''
        }
        return txt
            .split(/(\[[\u4e00-\u9fff,\uff1f,\w]{1,8}\])/)
            .filter(str => str.length > 0).map(str => {
                let obj = {}
                if (/\[([\u4e00-\u9fff,\uff1f,\w]{1,8})\]/.test(str)) {
                    if (weibo_emojis[str]) {
                        obj.type = 1
                        obj.src = weibo_emojis[str].url
                    } else {
                        obj.type = 0
                        obj.value = str
                    }
                } else {
                    obj.type = 0
                    obj.value = str
                }
                return obj
            });
    }
    parseTopic(topic) {
        if (topic.iconSrc) {
            topic.iconSrc = qiniuUrl + topic.iconSrc
        }
        return topic
    }
    async request(url, data, method) {
        const token = wx.getStorageSync('token') || ''
        wx.showNavigationBarLoading()
        return await wepy.wx.request({
            url: baseUrl + url,
            data,
            header: {
                token,
                'Content-Type': 'application/json',
                'from-wx': '16f9d417-03c3-45cc-90c7-d58e4e447ae6'
            },
            method
        }).then(res => {
            console.log(res)
            console.log(url)
            wx.hideNavigationBarLoading()
            return res.data
        }).catch(() => {
            console.log(url)
            wx.hideNavigationBarLoading()
            return {
                code: -1
            }
        })
    }
    getQiniuUrl() {
        return qiniuUrl
    }
    getImgUrl() {
        return imgUrl
    }
    getUser() {
        return wx.getStorageSync('user')
    }
    getUserId() {
        const user = this.getUser()
        if (user) {
            return user.userId
        }
        return null
    }
    getUserType() {
        const user = this.getUser()
        if (user) {
            return user.userType
        }
        return null
    }
    isBinding() {
        const user = this.getUser()
        if (user) {
            return user.isBinding
        }
        return false
    }
    subscribe(fun) {
        wx.requestSubscribeMessage({
            tmplIds: ['OLvHH_KPw3LPS7ePgFsGhnNPQlQVYylWdS5ZLqvtQqw'],
            success(res) {
                for (var key in res) {
                    if (key != 'errMsg') {
                        if (res[key] == 'reject') {
                            if (fun) {
                                fun()
                            } else {
                                wx.showModal({
                                    title: '订阅消息',
                                    content: '您已拒绝了订阅消息，如需重新订阅请前往设置打开。',
                                    confirmText: '去设置',
                                    success: res => {
                                        if (res.confirm) {
                                            wx.openSetting({});
                                        }
                                    }
                                });
                            }
                            return;
                        } else {
                            wx.showToast({
                                title: '订阅成功'
                            });
                        }
                    }
                }
            },
            complete: () => {
                if (fun) {
                    fun()
                }
            }
        });
    }
    async getQiniuToken(fileName, width, isCover = false) {
        const res = await this.request('/api/upload/token', {
            fileName,
            width,
            isCover
        }, 'POST')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async uploadFile(imgs, type) {
        const userId = this.getUserId()
        for (const img of imgs) {
            let fileName = null
            let token = null
            switch (type) {
                case 0: // 头像
                    fileName = `u_${userId}_${new Date().getTime()}.jpge`
                    token = await this.getQiniuToken(fileName, 132)
                    break;
                case 1: // 话题
                    fileName = `t_${userId}_${new Date().getTime()}.jpge`
                    token = await this.getQiniuToken(fileName, 144)
                    break;
                case 2: // 帖子
                    fileName = `p_${userId}_${new Date().getTime()}.${img.type}`
                    token = await this.getQiniuToken(fileName, 300, true)
                    break;
                case 3: // 认证
                    fileName = `a_${userId}_${new Date().getTime()}.jpge`
                    token = await this.getQiniuToken(fileName, 500)
                    break;
                default:
                    break;
            }
            if (token === null) {
                continue
            }
            const result = await wepy.wx.uploadFile({
                url: 'https://up-z1.qiniup.com',
                filePath: img.path,
                name: 'file',
                formData: {
                    token: token,
                    key: fileName
                }
            }).then(res => {
                console.log(res);

                if (res.statusCode === 200) {
                    const obj = JSON.parse(res.data)
                    const {
                        key
                    } = obj
                    return {
                        path: key,
                        fileName
                    }
                } else {
                    return null
                }
            }).catch(() => {
                return null
            })
            if (result) {
                delete img.type
                img.path = result.path
            } else {
                img.path = null
            }
        }
        return type === 2 ? imgs : imgs[0].path
    }
    parseGender(gender) {
        return genders[gender]
    }
    parseUser(user) {
        if (user.avtater) {
            if (user.avtater.indexOf('http') === -1) {
                user.avtater = qiniuUrl + user.avtater;
            }
        }
        user.hasFollow = user.hasFollow || false
        user.sex = user.gender
        user.gender = this.parseGender(user.gender)
        return user
    }
    getHeadHeight() {
        return _headHeight
    }
    getHeight() {
        return _height
    }
    getBaseUrl() {
        return baseUrl
    }
}