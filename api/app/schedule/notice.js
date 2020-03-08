const Subscription = require('egg').Subscription;
const Controller = require('../controller/baseController');

module.exports = app => {
    return {
        schedule: {
            cron: '0 0 10 */1 * *',
            // interval: '120m', // 每1小时准点执行一次
            type: 'worker',
        },
        async task(ctx) {
            const Op = ctx.app.Sequelize.Op
            const users = await ctx.model.User.findAll({
                attributes: ['sysMsgCount', 'noticeCount', 'openId', 'platform'],
                where: {
                    userType: {
                        [Op.in]: [0, 1]
                    },
                    [Op.or]: {
                        sysMsgCount: {
                            [Op.gte]: 1
                        },
                        noticeCount: {
                            [Op.gte]: 1
                        }
                    }
                },
                limit: 200,
                offset: 0,
                raw: true
            }).then(items => {
                return items
            }).catch(() => {
                return []
            })
            for (const user of users) {
                ctx.app.touser = user.openId
                if (user.platform === 'qq') {
                    await ctx.app.controller.baseController.sendQQ.call(ctx)
                } else {
                    await ctx.app.controller.baseController.send.call(ctx)
                }
            }
        },
    };
};
// class Notice extends Subscription {
//   // 通过 schedule 属性来设置定时任务的执行间隔等配置
//   static get schedule() {
//     return {
//         interval: '10s',
//     //   interval: '0 0 */4 * * *', // 每1小时准点执行一次
//       type: 'worker', // 
//     };
//   }

//   // subscribe 是真正定时任务执行时被运行的函数
//   async subscribe() {
//       const Op = this.ctx.app.Sequelize.Op
//       const users = await this.ctx.model.User.findAll({
//         attributes: ['sysMsgCount', 'noticeCount', 'openId'],
//         where: {
//             userType: {
//                 [Op.in]: [0, 1]
//             },
//             [Op.or]: {
//                 sysMsgCount: {
//                     [Op.gte]: 1
//                 },
//                 noticeCount: {
//                     [Op.gte]: 1
//                 }
//             }
//         },
//         limit: 200,
//         offset: 0,
//         raw: true
//       }).then(items => {
//           return items
//       }).catch(() => {
//           return []
//       })
//       for (const user of users) {
//           this.ctx.messenger.
//          await this.ctx.app.controller.baseController.send.call(new Controller(this.ctx),user.openId)
//       }
//   }
// }

// module.exports = Notice;