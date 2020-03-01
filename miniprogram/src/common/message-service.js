import BaseService from "./base-service";
export default class MessageService extends BaseService {
    constructor() {
        super()
    }
    async notice() {
        const res = await this.request('/api/message/notice', null, 'GET')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async list(options) {
        const res = await this.request('/api/message/list', options, 'POST')
        if (res.code === 0) {
            return res.data.map(item => {
                if (item.post && item.post.imgs) {
                    item.post.imgs = item.post.imgs.map(img => {
                        const path = img.path
                        img.path = this.getQiniuUrl() + path
                        img.thumbPath = this.getQiniuUrl() + 'thumb_' + path
                        return img
                    })
                }
                return item
            })
        }
        return null
    }
    async sysList(options) {
        const res = await this.request('/api/message/sys/list', options, 'POST')
        if (res.code === 0) {
            return res.data
        }
        return
    }
    async read(id, isSys = false) {
        const res = await this.request('/api/message/read', { id, isSys }, 'POST')
        if (res.code === 0) {
            return true
        }
        return false
    }
}