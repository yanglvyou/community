'use strict';


const Controller = require('./baseController');
const qiniu = require('qiniu');

class UploaderController extends Controller {
  async getQiniuToken() {
    const {
      AccessKey,
      SecretKey,
      bucket,
    } = this.config.qiniu;
    const { fileName, width, isCover } = this.ctx.request.body;
    const mac = new qiniu.auth.digest.Mac(AccessKey, SecretKey);
    const thumb = qiniu.util.urlsafeBase64Encode(`${bucket}:thumb_${fileName}`);
    const options = {
      // scope:isCover ? `${bucket}:${fileName}` : bucket,
      scope: bucket,
      // insertOnly: 0,
      persistentOps: isCover ? `imageMogr2/auto-orient/thumbnail/!50p/gravity/NorthWest/crop/x400/interlace/1/blur/1x0/quality/75|saveas/${thumb}` : `imageMogr2/auto-orient/thumbnail/${width}x${width}/interlace/1/blur/1x0/quality/75|saveas/${thumb}`,
      returnBody: '{"key":"$(key)"}',
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    this.success(uploadToken);
  }
}
module.exports = UploaderController;
