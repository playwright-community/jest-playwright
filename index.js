module.exports = require('./lib/PlaywrightEnvironment').default
module.exports.globalSetup = require('./lib/global').setup
module.exports.globalTeardown = require('./lib/global').teardown
