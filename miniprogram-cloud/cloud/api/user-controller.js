const BaseController = require('./base-controller.js')
const constellation = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座'];
const constellationDate = [
  [
    [1, 21],
    [2, 19],
  ],
  [
    [2, 20],
    [3, 20],
  ],
  [
    [3, 21],
    [4, 20],
  ],
  [
    [4, 21],
    [5, 21],
  ],
  [
    [5, 22],
    [6, 21],
  ],
  [
    [6, 22],
    [7, 22],
  ],
  [
    [7, 23],
    [8, 23],
  ],
  [
    [8, 24],
    [9, 23],
  ],
  [
    [9, 24],
    [10, 23],
  ],
  [
    [10, 24],
    [11, 22],
  ],
  [
    [11, 23],
    [12, 21],
  ],
  [
    [12, 22],
    [1, 20],
  ],
];
class UserController extends BaseController {
  constructor() {
    super()
  }
  async login(data, context) {
    let {
      shareId,
      openid
    } = data
    openid = openid || context.OPENID
    let user = await db.collection('users').doc(openid).field({
      openid: true,
      subscribe: true,
      nick: true,
      avtater: true,
      isBinding: true,
      userType: true,
      isAuth: true,
      school: true,
      grade: true,
      sysMsgCount: true,
      noticeCount: true
    }).get().then(res => {
      return res.data
    }).catch((err) => {
      console.log(err)
      return null
    })
    if (!user) {
      user = await db.collection('users').add({
        data: {
          shareId,
          _id: context.OPENID,
          openid: context.OPENID,
          unionid: context.UNIONID,
          subscribe: null,
          nick: null,
          avtater: null,
          platform: 'wx',
          isAuth: false,
          isBinding: false,
          userType: 0,
          grade: 0,
          subscribe: false,
          registerDate: Date.now(),
          sysMsgCount: 0,
          noticeCount: 0,
          followNum: 0,
          fansNum: 0,
          thumbsNum: 0,
          drill: 100,
          shell: 0
        }
      }).then((res) => {
        return {
          _id: res._id,
          school: null,
        }
      }).catch((err) => {
        console.log(err)
        return null
      })
    }
    return user
  }
  async bindInfo(data, context) {
    data.isBinding = true
    return await db.collection('users').doc(context.OPENID).update({
      data
    }).then(() => this.success()).catch(() => this.fail())
  }
  async details(data, context) {
    const { id } = data
    return await db.collection('users').doc(id).get().then(async res => {
      if (res.data) {
        res.data.isSelf = id === context.OPENID
        res.data.hasFollow = await db.collection('userFollows').where({
          openid: context.OPENID
        }).count().then(_res => {
          return _res.total > 0
        }).catch(() => {
          return false
        })
      }
      return this.success(res.data)
    }).catch(() => this.fail())
  }
  async follow(data, context) {
    const {
      toId
    } = data
    try {
      return await db.runTransaction(async transaction => {
        const hasNotice = await transaction.collection('userNotices').where({
          toId,
          fromId: context.OPENID,
          noticeType: 6
        }).count()
        if (await transaction.collection('userFollows').where({
          toId,
          fromId: context.OPENID,
        }).count()) {
          return true
        }
        let isUp = await transaction.collection('userFollows').add({
          data: {
            toId,
            fromId: context.OPENID,
            followDate: Date.now()
          }
        })
        if (!isUp) {
          await transaction.rollback(-100)
        }
        isUp = await transaction.collection('users').doc(context.OPENID).update({
          data: {
            followNum: _.inc(1)
          }
        })
        if (!isUp) {
          await transaction.rollback(-100)
        }
        isUp = await transaction.collection('users').doc(toId).update({
          data: hasNotice ? {
            fansNum: _.inc(1)
          } : {
              fansNum: _.inc(1),
              noticeCount: _.inc(1)
            }
        })
        if (!isUp) {
          await transaction.rollback(-100)
        }
        if (!hasNotice) {
          isUp = await transaction.collection('userNotices').add({
            data: {
              toId,
              fromId: context.OPENID,
              noticeType: 6,
              isRead: false,
              senDate: Date.now()
            }
          })
          if (!isUp) {
            await transaction.rollback(-100)
          }
        }
        return true
      }).then(() => {
        return this.success()
      }).catch(() => {
        return this.fail()
      })
    } catch (e) {
      return this.fail()
    }
  }
  async cancelFollow(data, context) {
    const {
      id
    } = data
    const userId = context.OPENID
    return await db.runTransaction(async transaction => {
      let isUp = await transaction.collection('userFollows').where({
        fromId: userId,
        toId: id
      }).remove()
      if (!isUp) {
        await transaction.rollback(-100)
      }
      isUp = await transaction.collection('userFollows').doc(userId).update({
        data: {
          followNum: _.inc(-1)
        }
      })
      if (!isUp) {
        await transaction.rollback(-100)
      }
      isUp = await transaction.collection('userFollows').doc(id).update({
        data: {
          fansNum: _.inc(-1)
        }
      })
      if (!isUp) {
        await transaction.rollback(-100)
      }
    }).then(() => {
      return this.success()
    }).catch(() => {
      return this.fail()
    })
  }
  async newData(data, context) {
    return await db.collection('users').doc(context.OPENID).field({
      _id: 1,
      nick: 1,
      avtater: 1,
      isBinding: 1,
      isAuth: 1,
      sysMsgCount: 1,
      noticeCount: 1,
      followNum: 1,
      fansNum: 1,
      thumbsNum: 1,
      shell: 1,
      drill: 1
    }).get().then(res => this.success(res.data)).catch(() => this.fail())
  }
  async searchSchool(data, context) {
    const {
      keyword,
      pageIndex,
      pageSize
    } = data
    return await db.collection('schools').where({
      name: db.RegExp({
        regexp: '.*' + keyword,
        options: 'i',
      })
    }).skip((pageIndex - 1) * pageSize)
      .limit(pageSize).get()
      .then(res => this.success(res.data))
      .catch(() => this.fail())
  }
  async change(data, context) {
    const {
      filed,
      value
    } = data
    const user = {
      [filed]: value,
    }
    if (filed === 'birthday') {
      const date = new Date(value);
      const m = date.getMonth() + 1;
      const d = date.getDate();
      let index = -1;
      for (let i = 0; i < constellationDate.length; i++) {
        const e = constellationDate[i];
        if ((m === e[0][0] && d >= e[0][1]) || (m === e[1][0] && d <= e[1][1])) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        user.constellation = constellation[index];
      }
    }
    if (filed === 'hometown') {
      const arr = value.split(' ');
      user.province = arr[0];
      user.city = arr[1];
    }
    return await db.collection('users').doc(context.OPENID).update({
      data: user
    }).then(() => this.success()).catch(() => this.fail())
  }
  async followList(data, context) {
    const {
      pageIndex,
      pageSize,
      type,
      userId
    } = data
    return await db.collection('users').where({
      [type === 0 ? 'fromId' : 'toId']: userId
    }).skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .orderBy('followDate', 'DESC')
      .get()
      .then(async res => {
        for (item in res.data) {
          item.user = await db.collection('users').doc(item[type === 0 ? 'fromId' : 'toId']).fiel({
            openid: true,
            nick: true,
            avtater: true,
            gender: true,
            userType: true,
            isAuth: true,
            school: true,
            grade: true
          }).get(res => {
            return res.data && res.data[0] || null
          }).catch(() => {
            return null
          })
        }
        return this.success(res.data)
      }).catch(() => {
        return this.success([])
      })
  }
  async auth(data, content) {
    const {
      realName,
      authSrc
    } = data
    return await db.collection('users').doc(context.OPENID).update({
      data: {
        realName,
        authSrc
      }
    }).then(() => this.success()).catch(() => {
      return this.fail()
    })
  }
  async qrCode(data, context) {
    const { postId, commentId } = data
    const userId = context.OPENID
    const scene = `id=${userId}`
    return await cloud.openapi.wxacode.getUnlimited({
      scene,
      width: 144,
      page: 'pages/index',
    }).then(async res => {
      if (res.errCode === 0) {
        return await cloud.uploadFile({
          cloudPath: `qrcode/${userId}.jpg`,
          fileContent: res.buffer,
        }).then(async res => {
          return await cloud.getTempFileURL({
            fileList: [res.fileID]
          }).then(_res => {
            if (_res.fileList[0].status === 0) {
              return this.success(_res.fileList[0].tempFileURL)
            }
            return this.fail(10001, _res.fileList[0].errMsg)
          }).catch((err) => this.fail(10002, err.message))
        }).catch((err) => {
          return this.fail(10003, err.message)
        })
      } else {
        return this.fail(10004, res.errmsg)
      }
    }).catch(err => this.fail(10005, err.message))
  }
}
module.exports = UserController;