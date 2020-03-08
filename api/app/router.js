'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.prefix(`/${app.config.prefix}`)
  /**上传图片 */
  router.post('/api/upload/token', controller.uploader.getQiniuToken)
  /**用户API */
  router.post('/api/login', controller.user.login)
  router.post('/api/user/binding', controller.user.bindInfo)
  router.get('/api/user/details/:id', controller.user.details)
  router.get('/api/user/follow/:id', controller.user.follow)
  router.post('/api/user/fans', controller.user.followList)
  router.get('/api/user/follow/cancel/:id', controller.user.cancelFollow)
  router.get('/api/user/refresh', controller.user.newData)
  router.post('/api/user/change', controller.user.change)
  router.post('/api/user/school', controller.user.searchSchool)
  router.post('/api/user/auth', controller.user.auth)
  router.get('/api/public/user/qrcode/:userId/:postId/:commentId', controller.user.getQrCode)
  router.get('/api/user/send', controller.user.send)
  /**帖子API */
  router.post('/api/post/release', controller.post.Release)
  router.post('/api/post/analyse', controller.post.analyseUrl)
  router.post('/api/post/recommend', controller.post.recommend)
  router.post('/api/post/follow', controller.post.follow)
  router.get('/api/post/recommend/new', controller.post.recommendForNew)
  router.post('/api/post/comment', controller.post.comment)
  router.post('/api/post/list/school', controller.post.listForSchool)
  router.post('/api/post/like', controller.post.like)
  router.post('/api/post/like/cancel', controller.post.cancelLike)
  router.post('/api/post/comment/list', controller.post.getComments)
  router.post('/api/post/list/user', controller.post.listForUser)
  router.post('/api/post/answers', controller.post.answers)
  router.get('/api/post/comment/get/:id', controller.post.getCommentDetails)
  router.get('/api/public/article/:url',controller.post.article)
  router.get('/api/public/image/:url',controller.post.getImg)
  router.get('/api/post/details/:id', controller.post.details)
  router.get('/api/post/remove/:id', controller.post.removePost)
  router.get('/api/post/comment/remove/:id', controller.post.removeComment)
  router.get('/api/post/recommend/post/:id', controller.post.recommendPost)
  router.get('/api/post/comment/hot/:id', controller.post.hotComment)
  router.get('/api/post/user/comment/list/:pageIndex/:pageSize', controller.post.commentForUser)
  router.get('/api/post/user/like/list/:pageIndex/:pageSize', controller.post.likeForUser)
  /**话题API */
  router.post('/api/topic/post/list', controller.post.listForTopic)
  router.post('/api/topic/list', controller.topic.list)
  router.post('/api/topic/list/user', controller.topic.listForUser)
  router.post('/api/topic/follow/user/list', controller.topic.users)
  router.post('/api/topic/add', controller.topic.add)
  router.get('/api/topic/details/:id', controller.topic.details)
  router.get('/api/topic/follow/:id', controller.topic.follow)
  router.get('/api/topic/follow/cancel/:id', controller.topic.cancelFollow)
  /**消息API */
  router.get('/api/message/notice', controller.message.notice)
  router.post('/api/message/list', controller.message.list)
  router.post('/api/message/sys/list', controller.message.sysList)
  router.post('/api/message/read', controller.message.read)

  /**纸飞机 */
  router.get('/api/plane/list/:pageIndex/:pageSize', controller.plugin.plane.list);
  router.get('/api/plane/read/:id', controller.plugin.plane.read);
  router.post('/api/plane/edit', controller.plugin.plane.addOrUp);
  router.get('/api/plane/remove', controller.plugin.plane.remove);
  router.post('/api/plane/info', controller.plugin.plane.getPlane);
  /**打赏 */
  router.post('/api/tip/reward', controller.plugin.tip.reward)
  router.post('/api/tip/convert', controller.plugin.tip.convert)
  router.get('/api/tip/assets', controller.plugin.tip.getAssets)
  router.post('/api/tip/monetize', controller.plugin.tip.monetize)
  router.post('/api/tip/bind', controller.plugin.tip.bindingMP)
  router.post('/api/tip/trade', controller.plugin.tip.tradeLogs)
};
