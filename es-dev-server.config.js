const cors = require('@koa/cors');

module.exports = {
  port: 8000,
  cors: true,
  watch: true,
  open: false,
  nodeResolve: true,
  appIndex: 'demo/index.html',
  plugins: [],
  moduleDirs: ['node_modules'],
  middlewares: [cors()],
};
