const codeStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
class BaseController {
  constructor() { }
  success(data) {
    return {
      code: 0,
      data,
    };
  }
  fail(erroCode = 0, msg = '') {
    return {
      erroCode,
      msg,
      code: -1,
    };
  }
  async getUserInfo(id) {
    return await this.getByKey('users', id, {
      openid: true,
      nick: true,
      avtater: true,
      gender: true,
      userType: true,
      isAuth: true,
      school: true,
      grade: true
    })
  }
  async getByKey(tableName, id, fields) {
    return await db.collection(tableName).doc(id).field(fields).get().then(res => {
      return res.data
    }).catch(() => null)
  }
  getId() {
    var ret = ''
    var ms = (new Date()).getTime()
    ret += this.base62encode(ms, 6) 
    ret += this.base62encode(Math.ceil(Math.random() * (62 ** 6)), 6)
    return ret
  }
  base62encode(v, n) {
    var ret = ""
    for (var i = 0; i < n; i++) {
      ret = codeStr[v % codeStr.length] + ret
      v = Math.floor(v / codeStr.length)
    }
    return ret
  }
}
module.exports = BaseController;