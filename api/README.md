# 社区服务端API

---
## 基于eggjs开发(eggjs+mysql+redis)
```bash
$ cd api
$ npm install
$ npm run dev
```
#### 具体步骤
- 手动创建mysql数据库：community
- 在api目录下运行命令:
```console
npx sequelize db:migrate
```
- 打开config目录下的config.default.js进行相关配置
```
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
```
