// 云函数入口文件
const cloud = require('wx-server-sdk')
const User = require('./user-controller.js')
const Post = require('./post-controller.js')
const Topic = require('./topic-controller.js')
const Tip = require('./tip-controller.js')
const Plane = require('./plane-controller.js')
const Message = require('./message-controller.js')
const api = {
  user: new User(),
  post: new Post(),
  topic: new Topic(),
  tip: new Tip(),
  plane: new Plane(),
  message: new Message()
}
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
// const db = cloud.database({
//   throwOnNotFound: false
// })
// const _ = db.command
global.db = cloud.database({
  throwOnNotFound: false,
  autoRecommend: true
})
global.cloud = cloud
global._ = db.command
global.$ = _.aggregate
global.isInit = false
// 云函数入口函数
exports.main = async (event, context) => {
  const {
    action,
    controller,
    data
  } = event
  if (!isInit) {
    try {
      await db.createCollection('messages').catch(() => null)
      await db.createCollection('postComments').catch(() => null)
      await db.createCollection('postLikes').catch(() => null)
      await db.createCollection('postRecommends').catch(() => null)
      await db.createCollection('postViews').catch(() => null)
      await db.createCollection('posts').catch(() => null)
      await db.createCollection('schools').catch(() => null)
      await db.createCollection('topicFollows').catch(() => null)
      await db.createCollection('topics').catch(() => null)
      await db.createCollection('trades').catch(() => null)
      await db.createCollection('userFollows').catch(() => null)
      await db.createCollection('userNotices').catch(() => null)
      await db.createCollection('userSysMessages').catch(() => null)
      await db.createCollection('users').catch(() => null)
    } catch (error) {
      console.log(error);
      
    } finally {
      isInit = true
    }
  }
  return await api[controller][action](data, cloud.getWXContext())
}