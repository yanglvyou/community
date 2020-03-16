import BaseService from "../../common/base-service";
class TipService extends BaseService {
    async reward(toId, postId, num) {
        return await this.post(async () => {
            return await this.callFunction('tip', 'reward', { toId, postId, num })
        }, '打赏中...', '已打赏', '打赏失败,重试')
    }
    async convert(num) {
        return await this.post(async () => {
            return await this.callFunction('tip', 'convert', { num })
        }, '转换中...', '已转换', '转换失败,重试')
    }
    async trade({ pageIndex, pageSize }) {
        const res = await this.callFunction('tip', 'tradeLogs', { pageIndex, pageSize })
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async getAssets() {

        const res = await this.callFunction('tip', 'getAssets', {})
        if (res.code === 0) {
            return res.data
        }
        return null
    }
    async monetize(num) {
        return await this.post(async () => {
            return await this.callFunction('tip', 'monetize', { num })
        }, '申请中...', '已申请', '申请失败,重试')
    }
}
export const Tip = new TipService()