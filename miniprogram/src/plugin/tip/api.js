import BaseService from "../../common/base-service";
class TipService extends BaseService {
    async reward(toId, postId, num) {
        return await this.post(async () => {
            return await this.request('/api/tip/reward', { toId, postId, num }, 'POST')
        }, '打赏中...', '已打赏', '打赏失败,重试')
    }
    async convert(num) {
        return await this.post(async () => {
            return await this.request('/api/tip/convert', { num }, 'POST')
        }, '转换中...', '已转换', '转换失败,重试')
    }
    async trade({ pageIndex, pageSize }) {
        const res = await this.request('/api/tip/trade', { pageIndex, pageSize }, 'POST')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async getAssets() {

        const res = await this.request('/api/tip/assets', null, 'GET')
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async monetize(num) {
        return await this.post(async () => {
            return await this.request('/api/tip/monetize', { num }, 'POST')
        }, '申请中...', '已申请', '申请失败,重试')
    }
}
export const Tip = new TipService()