module.exports = require('./lib/PlaywrightEnvironment').default
module.exports.getPlaywrightEnv =
  require('./lib/PlaywrightEnvironment').getPlaywrightEnv
module.exports.globalSetup = require('./lib/global').setup
module.exports.globalTeardown = require('./lib/global').teardown
