const BaseController = require('./base-controller.js')
const request = require("request");
const cheerio = require('cheerio');
const moment = require('moment');
moment.locale('zh-cn');
class PostController extends BaseController {
  constructor() {
    super()
  }
  async release(data, context) {
    const {
      questionId,
      articleTitle,
      articleImg,
      articleHtml,
      articleDelta,
      introduction,
      content,
      imgs,
      posType,
      link,
      video,
      audio,
      topicId,
      topicTitle,
      latitude,
      longitude,
      address
    } = data
    const _userId = context.OPENID
    const user = await db.collection('users').doc(_userId).get().then(res => res.data).catch(() => null)
    if (!user) {
      return this.fail()
    }
    if (content) {
      const _err = await cloud.openapi.security.msgSecCheck({
        content
      }).then(res => {
        return res.errCode === 0 ? null : res.errMsg
      }).catch((err) => {
        return err.message
      })
      if (_err) {
        return this.fail(10011, _err);
      }
    }
    const follow = await db.collection('topicFollows').where(_.and([{
      userId: _userId
    }, {
      topicId: topicId
    }])).get().then(res => {
      return res.data && res.data[0] || null
    }).catch(() => {
      return null
    })
    return await db.runTransaction(async transaction => {
      const _post = await transaction.collection('posts').add({
        data: {
          userId: _userId,
          isRecommend: user.school ? db.config.autoRecommend : false,
          questionId,
          articleTitle,
          articleImg,
          articleHtml,
          articleDelta,
          introduction,
          content,
          imgs,
          posType,
          link,
          video,
          audio,
          topicId,
          topicTitle,
          latitude,
          longitude,
          address,
          isTop: false,
          shell: 0,
          thumbsCount: 0,
          commentCount: 0,
          viewCount: 0,
          senDate: Date.now()
        }
      }).catch(() => {
        return null
      })
      if (!_post) {
        await transaction.rollback(-1)
      }
      if (questionId) {
        const $post = await transaction.collection('posts').doc(questionId).get().then(res => {
          return res.data
        }).catch(() => {
          return null
        })
        if (!$post) {
          await transaction.rollback(-2)
        }
        if (!await transaction.collection('posts').doc(questionId).update({
          data: {
            commentCount: _.inc(1)
          }
        }).catch(() => null)) {
          await transaction.rollback(-3)
        }
        if (!await transaction.collection('users').doc($post.userId).update({
          data: {
            noticeCount: _.inc(1)
          }
        }).catch(() => null)) {
          await transaction.rollback(-4)
        }
        if (!await transaction.collection('userNotices').add({
          data: {
            toId: $post.userId,
            fromId: _userId,
            postId: _post._id,
            noticeType: 7,
            senDate: Date.now()
          }
        }).catch(() => null)) {
          await transaction.rollback(-5)
        }
      } else {
        if (db.config.autoRecommend && user.school) {
          await transaction.collection('postRecommends').add({
            data: {
              postId: _post._id,
              userId: _userId,
              posType: posType,
              recommendType: 0,
              school: user.school,
              senDate: Date.now()
            }
          })
        }
      }
      if (!await transaction.collection('topics').doc(topicId).update({
        data: {
          postCount: _.inc(1)
        }
      }).catch(() => null)) {
        await transaction.rollback(-6)
      }
      if (!follow) {
        if (!await transaction.collection('topicFollows').add({
          data: {
            userId: _userId,
            topicId: topicId,
            score: 10,
            hasFollow: false
          }
        }).catch(() => null)) {
          await transaction.rollback(-7)
        }
      } else {
        if (!await transaction.collection('topicFollows').doc(follow._id).update({
          data: {
            score: _.inc(5)
          }
        }).catch(() => null)) {
          await transaction.rollback(-8)
        }
      }
    }).then(() => {
      return this.success()
    }).catch((err) => {
      return this.fail(10001, err.message)
    })

  }
  async analyseUrl(data, context) {
    const {
      url
    } = data
    return await new Promise((resolve, reject) => {
      request(url, function (error, response, body) {
        if (!error && (response && response.statusCode === 200)) {
          const $ = cheerio.load(body);
          let title = null
          let imageSrc = null
          if (/(https):\/\/(mp.weixin.qq.com)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
            title = $('meta[property="twitter:title"]').attr('content')
            imageSrc = $('meta[property="twitter:image"]').attr('content')
          } else if (/(https):\/\/(juejin.im)[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
            title = $('title').text()
            imageSrc = $('link[rel="apple-touch-icon"]').attr('href')
          } else if (/(https):\/\/([www.jianshu.com|zhuanlan.zhihu.com])[-A-Za-z0-9+&@#/%=~_|]*/.test(url)) {
            title = $('meta[property="og:title"]').attr('content')
            imageSrc = $('meta[property="og:image"]').attr('content')
          }
          if (title) {
            resolve({
              title,
              imageSrc
            })
          } else {
            reject()
          }
        } else {
          reject(error)
        }
      });
    }).then(obj => {
      return this.success(obj)
    }).catch((err) => {
      return this.fail(10001,err.message)
    })
  }
  async recommend(data, context) {
    const {
      pageIndex,
      pageSize,
      begin,
      isRefresh,
      type
    } = data
    let where = [];
    if (type === 0) {
      where.push({
        posType: _.in([0, 1, 2, 3])
      })
    } else if (type === 1) {
      where.push({
        posType: type - 1
      })
    } else if (type === 2) {
      where.push({
        posType: _.in([1, 2])
      })
    } else {
      where.push({
        posType: type
      })
    }
    if (begin) {
      if (isRefresh) { // 刷新
        where.push({
          senDate: _.gt(begin)
        })
      } else { // 加载更多
        where.push({
          senDate: _.lt(begin)
        })
      }
    }
    const items = []
    const _items = await db.collection('postRecommends')
      .where(_.and(where))
      .orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .field({
        postId: true,
        userId: true
      })
      .get().then(res => {
        return res.data
      }).catch(() => {
        return null
      })
    if (_items) {
      for (const _item of _items) {
        const user = await this.getUserInfo(_item.userId)
        const post = await this.getByKey('posts', _item.postId, {
          articleHtml: false,
          articleDelta: false
        })
        const likers = await this._getLikers(_item.postId)
        const comment = await this._getHotComment(_item.postId)
        items.push({
          user,
          post,
          likers,
          comment
        })
      }
    }
    return this.success(items)
  }
  async recommendPost(data, context) {
    const {
      id
    } = data
    const _post = await this.getByKey('posts', id, {
      userId: true,
      posType: true,
      articleTitle: true,
      introduction: true,
      content: true,
      isRecommend: true
    })
    return await db.runTransaction(async t => {
      if (_post.isRecommend) {
        if (!await t.collection('postRecommends').doc(id).remove().catch(() => false)) {
          await t.rollback(-100)
        }
        if (!await t.collection('posts').doc(id).update({
          data: {
            isRecommend: false
          }
        })) {
          await t.rollback(-100)
        }
      } else {
        if (!await t.collection('posts').doc(id).update({
          data: {
            isRecommend: true
          }
        })) {
          await t.rollback(-100)
        }
        if (!await t.collection('postRecommends').add({
          data: {
            postId: _post.id,
            userId: _post.userId,
            posType: _post.posType,
            recommendType: 0,
            senDate: Date.now()
          }
        }).catch(() => false)) {
          await t.rollback(-100)
        }
        const _str = _post.articleTitle || _post.introduction || _post.content
        const _msg = `你的帖子「${_str.substring(0, _str.length > 12 ? 12 : _str.length)}...」已被系统推荐`
        const message = await t.collection('messages').add({
          data: {
            content: _msg,
            contentType: 0,
            contentType: 0,
            createDate: Date.now()
          }
        }).then(res => res).catch(() => null)
        if (!message) {
          await t.rollback(-100)
        }
        if (!await db.collection('userSysMessages').add({
          data: {
            toId: _post.userId,
            messageId: message._id,
            senDate: Date.now(),
            isRead: false
          }
        })) {
          await t.rollback(-100)
        }
        if (!await db.collection('users').doc(_post.userId).update({
          data: {
            sysMsgCount: _.inc(1)
          }
        }).catch(() => false)) {
          await t.rollback(-100)
        }
      }
    }).then(() => {
      return this.success()
    }).catch((err) => {
      return this.fail(10001, err.message)
    })
  }
  async follow(data, context) {
    const {
      pageIndex,
      pageSize,
      begin,
      isRefresh
    } = data
    const items = []
    const where = [
      {
        posType: _.in([0, 1, 2, 3, 4, 5])
      }
    ]
    if (begin) {
      where.push({
        senDate: isRefresh ? _.gt(begin) : _.lt(begin)
      })
    }
    const followers = await db.collection('userFollows').where(_.and([
      {
        fromId: context.OPENID
      }
    ])).field({
      toId: true
    }).get().then((res) => res.data.map(u => u.toId)).catch(() => [])
    followers.push(context.OPENID)
    where.push({
      userId: _.in(followers)
    })
    const _items = await db.collection('posts').where(_.and(where))
      .orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(res => res.data).catch(() => [])
    for (const _item of _items) {
      const user = await this.getUserInfo(_item.userId)
      const likers = await this._getLikers(_item.id)
      const comment = await this._getHotComment(_item.id)
      items.push({
        post: _item,
        user,
        likers,
        comment
      })
    }
    return this.success(items)
  }
  async recommendForNew(data, context) {
    return this.success([])
  }
  async listForTopic(data, context) {
    const {
      id,
      pageIndex,
      pageSize,
      begin,
      isRefresh,
      type
    } = data
    const where = [{
      topicId: id
    }]
    let sort = {
      senDate: -1
    }
    if (type === 0) {
      where.push({
        posType: _.in([0, 1, 2, 3])
      })
    } else if (type === 1) {
      sort = {
        hot: -1
      }
      where.push({
        posType: _.in([0, 1, 2, 3])
      })
    } else if (type === 2) {
      where.push({
        posType: 0
      })
    } else if (type === 3) {
      where.push({
        posType: _.in([1, 2])
      })
    } else if (type === 4) {
      where.push({
        posType: 3
      })
    }
    if (begin) {
      if (isRefresh) {
        where.push({
          senDate: _.gt(begin)
        })
      } else {
        where.push({
          senDate: _.lt(begin)
        })
      }
    }
    const items = []
    const _items = await db.collection('posts')
      .aggregate()
      .project({
        articleHtml: 0,
        articleDelta: 0
      })
      .addFields({
        hot: $.add(['$thumbsCount', '$viewCount', $.multiply(['$commentCount', 10])])
      })
      .match(_.and(where))
      .sort(sort)
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .end().then(res => res.list).catch(() => [])
    for (const _item of _items) {
      const user = await this.getUserInfo(_item.userId)
      const likers = await this._getLikers(_item._id)
      items.push({
        user,
        likers,
        post: _item
      })
    }
    return this.success(items)
  }
  async listForUser(data, context) {
    const {
      id,
      pageIndex,
      pageSize,
      type
    } = data
    const where = [{
      userId: id
    }]
    switch (type) {
      case 0:
        where.push({
          posType: _.in([0, 1, 2, 3])
        })
        break;
      case 1:
        where.push({
          posType: _.in([1, 2])
        })
        break;
      case 2:
        where.push({
          posType: _.in([3, 4])
        })
        break;

      default:
        break;
    }
    return await db.collection('posts')
      .where(_.and(where))
      .field({
        articleHtml: false,
        articleDelta: false
      })
      .orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(async res => {
        const user = await this.getUserInfo(id)
        const items = []
        for (const _item of res.data) {
          const likers = await this._getLikers(_item._id)
          items.push({
            user,
            likers,
            post: _item
          })
        }
        return this.success(items)
      }).catch((err) => this.fail(10001, err.message))
  }
  async listForSchool(data, context) {
    const {
      pageIndex,
      pageSize,
      school,
      begin,
      isRefresh
    } = data
    if (!school) {
      return this.success([])
    }
    const items = []
    const where = [
      {
        school
      }
    ]
    if (begin) {
      where.push({
        senDate: isRefresh ? _.gt(begin) : _.lt(begin)
      })
    }
    const _items = await db.collection('postRecommends')
      .where(_.and(where))
      .field({
        postId: true,
        userId: true,
      }).orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(res => res.data).catch(() => [])
    for (const _item of _items) {
      const user = await this.getUserInfo(_item.userId)
      const post = await this.getByKey('posts', _item.postId, {
        articleHtml: false,
        articleDelta: false
      })
      const likers = await this._getLikers(_item.postId)
      const comment = await this._getHotComment(_item.postId)
      items.push({
        user,
        post,
        likers,
        comment
      })
    }
    return this.success(items)
  }
  async answers(data, context) {
    const {
      id,
      pageIndex,
      pageSize
    } = data
    const items = []
    const _items = await db.collection('posts').where({
      questionId: id
    }).field({
      articleHtml: false,
      articleDelta: false
    }).orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(res => res.data).catch(() => [])
    for (const _item of _items) {
      const user = await this.getUserInfo(_item.userId)
      items.push({
        post: _item,
        user
      })
    }
    return this.success(items)
  }
  async details(data, context) {
    const {
      id
    } = data
    const _post = await this.getByKey('posts', id, {})
    let _hasFollow = false
    if (_post) {
      const _hasLike = await db.collection('postLikes').where(_.and([{
        postId: id
      }, {
        userId: context.OPENID,
      },
      {
        likeType: 0
      }
      ])).count().then(res => res.total > 0).catch(() => false)
      const _user = await this.getUserInfo(_post.userId)
      const _topic = await this.getByKey('topics', _post.topicId, {
        des: false
      })
      const _likers = await this._getLikers(_post._id)
      if (_post.userId !== context.OPENID) {
        _hasFollow = await db.collection('userFollows').where(_.and([{
          fromId: context.OPENID,
        }, {
          toId: _post.userId
        }])).count().then(res => res.total > 0).catch(() => false)
      }
      return this.success({
        hasFollow: _hasFollow,
        post: _post,
        hasLike: _hasLike,
        user: _user,
        likers: _likers,
        topic: _topic
      })
    }
    return this.fail()
  }
  async comment(data, context) {
    const {
      toId,
      postId,
      commentId,
      commenType,
      content,
      imgs
    } = data
    const _err = await cloud.openapi.security.msgSecCheck({
      content
    }).then(res => {
      return res.errCode === 0 ? null : res.errMsg
    }).catch((err) => {
      return err.message
    })
    if (_err) {
      return this.fail(10011, _err);
    }
    const fromId = context.OPENID
    return await db.runTransaction(async t => {
      const obj = await t.collection('postComments').add({
        data: {
          fromId,
          toId,
          postId,
          commentId,
          commenType,
          content,
          imgs,
          thumbsCount: 0,
          replyCount: 0,
          senDate: Date.now(),
          isHot: false
        }
      }).catch(() => null)
      if (!obj) {
        t.rollback(-1)
      }
      if (!await t.collection('posts').doc(postId).update({
        data: {
          commentCount: _.inc(1)
        }
      }).catch(() => null)) {
        await t.rollback(-2)
      }
      if (commenType === 1 || commenType === 2) {
        if (!await t.collection('postComments').doc(commentId).update({
          data: {
            replyCount: _.inc(1)
          }
        })) {
          await t.rollback(-3)
        }
      }
      if (fromId !== toId) {
        if (!await db.collection('userNotices').add({
          data: {
            toId,
            fromId,
            postId,
            commentId: obj._id,
            replyId: commentId,
            noticeType: commenType,
            senDate: Date.now(),
            isRead: false
          }
        })) {
          await t.rollback(-4)
        }
        if (!await db.collection('users').doc(toId).update({
          data: {
            noticeCount: _.inc(1)
          }
        }).catch(() => 0)) {
          await t.rollback(-5)
        }
      }
      return obj
    }).then(async (obj) => {
      const comment = await db.collection('postComments').doc(obj._id).get()
        .then(res => res.data)
        .catch(() => null)
      const _user = await this.getUserInfo(fromId)
      comment.from = _user
      return this.success(comment)
    }).catch((err) => this.fail(10001, err.message))
  }
  async like(data, context) {
    const {
      toId,
      postId,
      commentId,
      likeType
    } = data
    const userId = context.OPENID
    const where = [{
      likeType,
      fromId: userId,
    }]
    if (likeType === 0 || likeType === 3) {
      where.push({
        postId
      })
    } else {
      where.push({
        commentId
      })
    }
    const _hasLike = await db.collection('userNotices').where(_.and(where)).count().then(res => res.total > 0).catch(() => false)
    return await db.runTransaction(async t => {
      if (!await t.collection('postLikes').add({
        data: {
          userId,
          toId,
          postId,
          commentId,
          likeType,
          senDate: Date.now(),
          isRead: false
        }
      }).catch(() => null)) {
        t.rollback(-100)
      }
      if (likeType === 0) {
        if (!await t.collection('posts').doc(postId).update({
          data: {
            thumbsCount: _.inc(1)
          }
        }).catch(() => false)) {
          t.rollback(-100)
        }
      } else {
        if (!await t.collection('postComments').doc(commentId).update({
          data: {
            thumbsCount: _.inc(1)
          }
        }).catch(() => false)) {
          t.rollback(-100)
        }
      }
      if (!await t.collection('users').doc(toId).update({
        data: userId !== toId ? {
          thumbsNum: _.inc(1),
          noticeCount: _.inc(1)
        } : {
            thumbsNum: _.inc(1),
          }
      }).catch(() => false)) {
        t.rollback(-100)
      }
      if (userId !== toId && !_hasLike) {
        if (!await t.collection('userNotices').add({
          data: {
            toId,
            fromId: userId,
            postId,
            commentId,
            noticeType: likeType + 3,
            senDate: Date.now(),
            isRead: false
          }
        }).catch(() => null)) {
          t.rollback(-100)
        }
      }
    }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
  }
  async cancelLike(data, context) {
    const {
      likeType,
      id
    } = data
    const postLike = await db.collection('postLikes').where(_.and([{
      likeType
    }, {
      userId: context.OPENID,
    }, {
      [likeType === 0 ? 'postId' : 'commentId']: id
    }])).get().then(res => res.data && res.data[0] || null).catch(() => null)
    if (!postLike) {
      return this.fail()
    }
    return await db.runTransaction(async t => {
      if (!await t.collection('postLikes').doc(postLike._id).remove().catch(() => null)) {
        await t.rollback(-100)
      }
      if (!await t.collection(likeType === 0 ? 'posts' : 'postComments').doc(id).update({
        data: {
          thumbsCount: _.inc(-1)
        }
      }).catch(() => false)) {
        await t.rollback(-100)
      }
      if (!await t.collection('users').doc(postLike.toId).update({
        data: {
          thumbsNum: _.inc(-1)
        }
      }).catch(() => false)) {
        await t.rollback(-100)
      }
    }).then(() => this.success()).catch((err) => this.fail(10001, err))
  }
  async getComments(data, context) {
    const {
      likeType,
      id,
      pageIndex,
      pageSize
    } = data
    const items = await db.collection('postComments').where(_.and([{
      [likeType === 0 ? 'postId' : 'commentId']: id
    }, {
      commenType: likeType === 0 ? likeType : _.in([1, 2])
    }])).orderBy('senDate', likeType === 0 ? 'desc' : 'asc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(res => res.data).catch(() => [])
    for (const item of items) {
      item.from = await this.getUserInfo(item.fromId)
      item.moment = moment(item.senDate).fromNow();
      if (likeType !== 0) {
        item.to = await this.getUserInfo(item.toId)
      }
      item.hasLike = await this._hasLike(item.commenType + 1, item._id, context.OPENID)
    }
    return this.success(items)
  }
  async getCommentDetails(data, context) {
    const {
      id
    } = data
    const comment = await this.getByKey('postComments', id, null)
    if (comment) {
      comment.from = await this.getUserInfo(comment.fromId)
      comment.hasLike = await this._hasLike(1, comment.id, context.OPENID)
      return this.success(comment)
    }
    return this.fail()
  }
  async removePost(data, context) {
    const {
      id,
      userType
    } = data
    const _post = await this.getByKey('posts', id, {
      userId: true,
      articleTitle: true,
      introduction: true,
      content: true
    })
    const postRecommend = await db.collection('postRecommends').where({
      postId: id
    }).get().then(res => res.data && res.data[0] || null).catch(() => null)
    if (_post && (_post.userId === context.OPENID || userType === 1)) {
      return await db.runTransaction(async t => {
        if (!await t.collection('posts').doc(_post._id).remove().catch(() => null)) {
          await t.rollback(-1)
        }
        if (userType === 1) {
          const _str = _post.articleTitle || _post.introduction || _post.content
          const _msg = `你的帖子「${_str.substring(0, _str.length > 12 ? 12 : _str.length)}...」已被系统删除`
          const message = await t.collection('messages').add({
            data: {
              content: _msg,
              contentType: 0,
              createDate: Date.now()
            }
          }).catch(() => null)
          if (!message) {
            await t.rollback(-2)
          }
          if (!await t.collection('userSysMessages').add({
            data: {
              toId: _post.userId,
              messageId: message._id,
              isRead: false,
              senDate: Date.now()
            }
          }).catch(() => null)) {
            await t.rollback(-3)
          }
          if (!await t.collection('users').doc(_post.userId).update({
            data: {
              sysMsgCount: _.inc(1)
            }
          }).catch(() => false)) {
            await t.rollback(-4)
          }
        }
        if (postRecommend) {
          if (!await t.collection('postRecommends').doc(postRecommend._id).remove().catch(() => false)) {
            await t.rollback(-5)
          }
        }
      }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
    }
    return this.fail()
  }
  async removeComment(data, context) {
    const {
      id,
      userType
    } = data
    const _comment = await this.getByKey('postComments', id, {
      'content': true,
      'fromId': true
    })
    if (_comment && (_comment.fromId === context.OPENID || userType === 1)) {
      return await db.runTransaction(async t => {
        if (!await db.collection('postComments').doc(id).remove().catch(() => false)) {
          t.rollback(-100)
        }
        if (userType === 1) {
          const _msg = `你的评论「${_comment.content}」已被系统删除`
          const message = await t.collection('message').add({
            data: {
              content: _msg,
              contentType: 0,
              createDate: Date.now()
            }
          }).catch(() => null)
          if (!message) {
            t.rollback(-100)
          }
          if (!await t.collection('userSysMessages').add({
            data: {
              toId: _comment.fromId,
              messageId: message._id,
              isRead: false,
              senDate: Date.now()
            }
          }).catch(() => null)) {
            t.rollback(-100)
          }
          if (!await t.collection('users').doc(_comment.fromId).update({
            data: {
              sysMsgCount: _.inc(1)
            }
          }).catch(() => false)) {
            t.rollback(-100)
          }
        }
      }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
    }
    return this.fail()
  }
  async hotComment(data, context) {
    const {
      id,
      userType
    } = data
    const _comment = await this.getByKey('postComments', id, {
      'content': true,
      'fromId': true
    })
    if (_comment && userType === 1) {
      return await db.runTransaction(async t => {
        if (_comment.isHot) {
          if (!await (t.collection('postComments').doc(id).update({
            data: {
              isHot: false
            }
          })).catch(() => false)) {
            t.rollback(-100)
          }
        } else {
          if (!await t.collection('postComments').doc(id).update({
            data: {
              isHot: true
            }
          })) {
            t.rollback(-100)
          }
          const _msg = `你的评论「${_comment.content}」已被系统选为热评`
          const message = await t.collection('message').add({
            data: {
              content: _msg,
              contentType: 0,
              createDate: Date.now()
            }
          }).catch(() => null)
          if (!message) {
            t.rollback(-100)
          }
          if (!await t.collection('userSysMessages').add({
            data: {
              toId: _comment.fromId,
              messageId: message._id,
              isRead: false,
              senDate: Date.now()
            }
          }).catch(() => null)) {
            t.rollback(-100)
          }
          if (!await t.collection('users').doc(_comment.fromId).update({
            data: {
              sysMsgCount: _.inc(1)
            }
          }).catch(() => false)) {
            t.rollback(-100)
          }
        }
      }).then(() => this.success()).catch((err) => this.fail(10001, err.message))
    }
    return this.fail()
  }
  async commentForUser(data, context) {
    const {
      pageIndex,
      pageSize
    } = data
    const items = []
    const _items = await db.collection('postComments').where(_.and([{
      fromId: context.OPENID
    }, {
      commenType: _.in([0, 1, 2])
    }])).skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .orderBy('senDate', 'desc')
      .get().then(res => res.data).catch(() => [])
    const user = await this.getUserInfo(context.OPENID)
    for (const item of _items) {
      const obj = {
        comment: item
      }
      if (item.commenType === 2) {
        obj.to = await this.getUserInfo(item.toId)
      }
      obj.user = user
      if (item.commentId) {
        obj.originComment = await this.getByKey('postComments', item.commentId, {})
      } else {
        obj.post = await this.getByKey('posts', item.postId, {
          introduction: true,
          content: true,
          imgs: true,
          posType: true
        })
      }
      items.push(obj)
    }
    return this.success(items)
  }
  async likeForUser(data, context) {
    const {
      pageIndex,
      pageSize
    } = data
    const items = []
    const _items = await db.collection('postLikes').where(_.and([{
      userId: context.OPENID
    }, {
      likeType: 0
    }])).orderBy('senDate', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get().then(res => res.data).catch(() => [])
    for (const item of _items) {
      let obj = null
      if (item.commentId) {
        obj = await this.getByKey('postComments', item.commentId, {})
        obj.dataType = 1
        obj.from = await this.getUserInfo(item.toId)
      } else {
        obj = {
          dataType: 0
        }
        obj.user = await this.getUserInfo(item.toId)
        obj.post = await this.getByKey('posts', item.postId, {
          articleHtml: false,
          articleDelta: false
        })
      }
      items.push(obj)
    }
    return this.success(items)
  }
  async _getLikers(postId) {
    const _likers = []
    const items = await db.collection('postLikes')
      .where(_.and([{
        postId: postId
      }, {
        likeType: 0
      }])).
      orderBy('senDate', 'desc')
      .skip(0).limit(5).field({
        userId: true
      }).get().then(res => res.data).catch(() => null)
    for (const item of items) {
      const _user = await this.getUserInfo(item.userId)
      if (_user) {
        _likers.push(_user.avtater)
      }
    }
    return _likers
  }
  async _getHotComment(postId) {
    return await db.collection('postComments').where(_.and([{
      postId
    }, {
      commenType: 0
    }, {
      isHot: true
    }])).limit(1).field({
      fromId: true,
      content: true,
      imgs: true
    }).get().then(res => res.data && res.data[0] || null).catch(() => null)
  }
  async _hasLike(likeType, id, userId) {
    const where = [{
      likeType: likeType === 0 ? 0 : _.in([1, 2])
    }, {
      userId
    }]
    where.push(likeType === 0 ? {
      postId: id
    } : {
        commentId: id
      })
    console.log(where)
    return db.collection('postLikes')
      .where(_.and(where))
      .count()
      .then(res => res.total > 0)
      .catch(() => false)
  }
}
module.exports = PostController;