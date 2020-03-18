import BaseService from "../../common/base-service";
class PlaneService extends BaseService {
    async list(pageIndex, pageSize) {
        const res = await this.callFunction('plane', 'list', { pageIndex, pageSize })
        if (res.code === 0) {
            return res.data.map(item => {
                item.user = this.parseUser(item.user)
                item.content = this.parseEmoji(item.content)
                item.id = item._id
                item.hasSeen = false
                return item
            })
        }
        return null
    }
    async read(id) {
        await this.callFunction('plane', 'read', { id })
    }
    async edit(content) {
        if (!this.isBinding()) {
            wx.navigateTo({
                url: '/pages/gender'
            });
            return
        }
        wx.showLoading({
            title: '发送中...',
            mask: true
        });
        const res = await this.callFunction('plane', 'addOrUp', { content })
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('已扔出', 'success')
            return res.data
        } else {
            let title = '发布失败,重试'
            if (res.erroCode > 0) {
                title = res.msg
            }
            this.showToast(title)
        }
        return null
    }
    async remove() {
        wx.showLoading({
            title: '撤销中...',
            mask: true
        });
        const res = await this.callFunction('plane', 'remove')
        wx.hideLoading()
        if (res.code === 0) {
            this.showToast('已撤销', 'success')
            return true
        }
        this.showToast('撤销失败,重试')
        return false
    }
    async details(id, isSelf) {
        const res = await this.callFunction('plane', 'getPlane', { id, isSelf })
        if (res.code === 0) {
            return res.data
        }
        return null
    }
}
export const Plane = new PlaneService()