// api/index.js
const app = require('../server');      // just import your Express app
module.exports = (req, res) => app(req, res);