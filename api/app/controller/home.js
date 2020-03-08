'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { url } = this.ctx.params
    console.log(this.ctx.params);
    if (url) {
      const result = await this.ctx.curl(url, {
        streaming: true,
      });
      this.ctx.set(result.header);
      this.ctx.body = result.res;
    }
  }
}

module.exports = HomeController;
