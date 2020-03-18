/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1581759033415_5829';
  config.secret = 'sdoi202@!@sd(*$5sd';
  config.prefix = 'v1' 
  // add your middleware config here
  config.middleware = [ 'authorize' ];
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  config.autoRecommend = true
  config.cluster = {
    listen: {
      path: '',
      port: 7001,
      hostname: '127.0.0.1',
    }
  };
  config.security = {
    // csrf: {
    //   // 判断是否需要 ignore 的方法，请求上下文 context 作为第一个参数
    //   ignore: () => true,
    // },
    csrf: false,
  };
  config.multipart = {
    mode: 'file',
  };
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };
  /**
   * redis配置
   */
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: 'auth',
      db: 1,
    },
  };
  /**
   * mysql数据库配置
   */
  config.sequelize = {
    delegate: 'model',
    baseDir: 'model',
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'community',
    username: 'root',
    password: 'LB123456',
    timezone: '+08:00',
  };
  exports.http = {
    headers: {
      common: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    },
    timeout: 10000,
  };
  /**
   * 微信小程序配置
   */
  config.miniprogram = {
    appid: '',
    secret: '',
  };
  /**
   * qq小程序配置
   */
  config.qqminiprogram = {
    appid: '',
    secret: ''
  };
  /**
   * 公众号配置
   */
  config.yitao = {
    appid: '',
    secret: '',
  };
  /**七牛存储配置 */
  config.qiniu = {
    AccessKey: '',
    SecretKey: '',
    bucket: '',
  };
  return {
    ...config,
    ...userConfig,
  };
};
