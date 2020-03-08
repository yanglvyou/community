'use strict';
const {
  Controller,
} = require('egg');
const moment = require('moment');
moment.locale('zh-cn');
class BaseController extends Controller {
  get user() {
    return this.ctx.user;
  }
  get Op() {
    return this.ctx.app.Sequelize.Op
  }
  get literal() {
    return this.ctx.app.Sequelize.literal
  }
  async getUserId() {
    if (this.user.userType === 1) {
      const _user = await this.randomUser()
      if (_user) {
        return _user.id
      }
    }
    return this.user.userId
  }
  async getUserInfo(userId) {
    const key = 'user_info_' + userId;
    let user = await this.get(key);
    if (user) {
      return user;
    }
    user = await this.findByPk(userId, ['id', 'openId', 'nick', 'avtater', 'gender', 'school', 'title', 'grade', 'isAuth', 'userType', 'followNum', 'fansNum', 'thumbsNum'], 'User');
    if (user) {
      await this.set(key, user, 5 * 60);
    }
    return user;
  }
  async send() {
    const touser = this.ctx.app.touser
    if (!touser) {
      return
    }
    const token = await this.getToken()
    const time = moment().format('MM/DD HH:mm')
    await this.ctx.http.post(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`, {
      access_token: token,
      touser: touser,
      page: 'pages/index',
      miniprogram_state: "formal",
      template_id: 'OLvHH_KPw3LPS7ePgFsGhnNPQlQVYylWdS5ZLqvtQqw',
      data: {
        'thing2': {
          value: '有人回复了你'
        },
        'date3': {
          value: time
        }
      }
    }).then(res => {
      console.log(res);

    }).catch(err => {
      console.log(err);

    })
    this.success()
  }
  async sendQQ() {
    const touser = this.ctx.app.touser
    if (!touser) {
      return
    }
    const token = await this.getQQToken()
    const time = moment().format('MM/DD HH:mm')
    await this.ctx.http.post(`https://api.q.qq.com/api/json/subscribe/SendSubscriptionMessage?access_token=${token}`, {
      access_token: token,
      touser: touser,
      page: 'pages/index',
      template_id: '3251c53b08622be278494b0d62e7310c',
      emphasis_keyword: 'keyword1',
      data: {
        'keyword1': {
          value: '有人回复了你'
        },
        'keyword1': {
          value: '玉帛书用户'
        },
        'keyword3': {
          value: time
        }
      }
    }).then(res => {
      console.log(res);

    }).catch(err => {
      console.log(err);

    })
    this.success()
  }
  async getToken() {
    const {
      appid,
      secret,
    } = this.config.miniprogram;
    const key = 'ACCESS_TOKEN';
    const token = await this.get(key);
    if (token) {
      return token;
    }
    const res = await this.ctx.http.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${
      appid
      }&secret=${secret}`
    );

    if (res.access_token) {
      await this.set(key, res.access_token, 1.5 * 60 * 60);
      return res.access_token;
    }
    return null;
  }
  async msgSecCheck(content) {
    if (content === '') {
      return true
    }
    const token = await this.getToken();
    if (token) {
      return await this.ctx.http.post(`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${token}`, {
        content
      }).then(async obj => {
        if (obj.errcode === 40001) {
          await this.delKey('ACCESS_TOKEN')
          return false
        }
        return obj.errcode === 0
      }).catch(() => {
        return false
      })
    }
    return false
  }
  async getQQToken() {
    const {
      appid,
      secret,
    } = this.config.qqminiprogram;
    const key = 'ACCESS_QQ_TOKEN';
    const token = await this.get(key);
    if (token) {
      return token;
    }
    const res = await this.ctx.http.get(
      `https://api.q.qq.com/api/getToken?grant_type=client_credential&appid=${
      appid
      }&secret=${secret}`
    );
    if (res.access_token) {
      await this.set(key, res.access_token, 1.5 * 60 * 60);
      return res.access_token;
    }
    return null;
  }
  async msgQQSecCheck(content) {
    if (content === '') {
      return true
    }
    const token = await this.getQQToken();
    if (token) {
      return await this.ctx.http.post(`https://api.q.qq.com/api/json/security/MsgSecCheck?access_token=${token}`, {
        content
      }).then(obj => {
        console.log(obj);

        return obj.errcode === 0
      }).catch(() => {
        return false
      })
    }
    return false
  }
  async set(key, value, time = 30) {
    await this.app.redis.set(key, JSON.stringify(value), 'EX', time);
  }
  async get(key) {
    const value = await this.app.redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }
  async delKey(key) {
    const stream = this.app.redis.scanStream({
      match: `${key}*`,
      count: 100,
    });
    stream.on('data', async keys => {
      await this.app.redis.del(keys);
    });
  }
  async getTopic(id) {
    const key = `TOPIC_${id}`
    let topic = await this.get(key)
    if (topic) {
      return topic
    }
    topic = await this.ctx.model.Topic.get(id)
    if (topic === -1 || !topic) {
      return null
    }
    await this.set(key, topic, 5 * 60)
    return topic
  }
  success(data) {
    this.ctx.body = {
      code: 0,
      data,
    };
  }
  fail(erroCode = 0, msg = '') {
    this.ctx.body = {
      erroCode,
      msg,
      code: -1,
    };
  }
  async findByPk(id, attributes = null, modelName = null) {
    return await this.ctx.model[modelName || this.Name].findByPk(id, {
      attributes,
      raw: true
    }).then(obj => {
      return obj
    }).catch(() => {
      return null
    })
  }
  async findOne(options, modelName = null) {
    options.raw = true
    return await this.ctx.model[modelName || this.Name].findOne(options).then((obj => {
      return obj
    })).catch(() => {
      return null
    })
  }
  async create(values, transaction = null, modelName = null) {
    return await this.ctx.model[modelName || this.Name].create(values, {
      transaction
    }).then(obj => {
      return obj.get();
    }).catch((err) => {
      console.log(err);

      return null;
    });
  }
  async destroy(options, modelName = null) {
    return await this.ctx.model[modelName || this.Name].destroy(options).then(() => {
      return true;
    }).catch((err) => {
      console.log(err);

      return false;
    });
  }
  async decrement(fields, where, by = 1, transaction = null, modelName = null) {
    return await this._compute(fields, 'decrement', {
      by,
      where,
      transaction
    }, modelName)
  }
  async increment(fields, where, by = 1, transaction = null, modelName = null) {
    return await this._compute(fields, 'increment', {
      by,
      where,
      transaction
    }, modelName)
  }
  async update(values, options, modelName = null) {
    return await this.ctx.model[modelName || this.Name].update(values, options).then(() => {
      return true
    }).catch((err) => {
      console.log(err);

      return false
    })
  }
  async _compute(fields, method, where, modelName = null) {
    return await this.ctx.model[modelName || this.Name][method](fields, where).then(() => {
      return true;
    }).catch((err) => {
      console.log(err);

      return false;
    });
  }
  async findAll(attributes, where, order, pageIndex, pageSize, modelName = null) {
    return await this.ctx.model[modelName || this.Name].findAll({
      attributes,
      where,
      order,
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      raw: true
    }).then(items => {
      return items
    }).catch((err) => {
      console.log(err);

      return []
    })
  }
  async count(where, modelName = null) {
    return await this.ctx.model[modelName || this.Name].count({ where }).then(num => {
      return num
    }).catch(() => {
      return 0
    })
  }
  async randomUser(gender = null) {
    const where = {
      userType: 2
    }
    if (gender != null) {
      where.gender = gender
    }
    return await this.ctx.model.User.findOne({
      attributes: ['id'],
      where,
      order: this.literal('RAND()')
    }).then(user => {
      return user
    }).catch(() => {
      return null
    })
  }
}
module.exports = BaseController;
