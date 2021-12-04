const cors = require('@koa/cors');

module.exports = {
  port: 8000,
  watch: true,
  open: false,
  nodeResolve: true,
  appIndex: 'demo/index.html',
  plugins: [],
  middleware: [cors()],
};
