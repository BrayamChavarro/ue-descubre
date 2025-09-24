// Netlify Function wrapper for Express API (API-only mode)
const serverless = require('serverless-http');
const app = require('../../app');
module.exports.handler = serverless(app, {
  request: function (request) {
    console.log(`[Fn] ${request.method} ${request.url}`);
  }
});

