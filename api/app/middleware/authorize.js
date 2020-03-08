/* eslint-disable no-empty */
'use strict';
const jwt = require('jsonwebtoken');

module.exports = () => {
  return async function paramtrans(ctx, next) {
    const {
      token,
    } = ctx.request.header;
    try {
      const user = jwt.verify(token, ctx.app.config.secret);
      if (user) {
        ctx.user = user;
        return next();
      } else {
        if (ctx.request.url.indexOf('/login') > -1 || ctx.request.url.indexOf('/public') > -1) {
          return next();
        }
      }
    } catch (error) {
      if (ctx.request.url.indexOf('/login') > -1 || ctx.request.url.indexOf('/public') > -1) {
        return next();
      }
     }
    // }
    ctx.status = 401;
    ctx.body = '非法访问';
    return;
  };
};
