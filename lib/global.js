"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardown = exports.setup = void 0;
/* eslint-disable no-console */
const jest_dev_server_1 = require("jest-dev-server");
const utils_1 = require("./utils");
let didAlreadyRunInWatchMode = false;
const logMessage = ({ message, action, }) => {
    console.log('');
    console.error(message);
    console.error(`\n☝️ You ${action} in jest-playwright.config.js`);
    process.exit(1);
};
async function setup(jestConfig) {
    const config = await utils_1.readConfig(jestConfig.rootDir);
    // If we are in watch mode, - only setupServer() once.
    if (jestConfig.watch || jestConfig.watchAll) {
        if (didAlreadyRunInWatchMode)
            return;
        didAlreadyRunInWatchMode = true;
    }
    if (config.server) {
        try {
            await jest_dev_server_1.setup(config.server);
        }
        catch (error) {
            if (error.code === jest_dev_server_1.ERROR_TIMEOUT) {
                logMessage({
                    message: error.message,
                    action: 'can set "server.launchTimeout"',
                });
            }
            if (error.code === jest_dev_server_1.ERROR_NO_COMMAND) {
                logMessage({
                    message: error.message,
                    action: 'must set "server.command"',
                });
            }
            throw error;
        }
    }
}
exports.setup = setup;
async function teardown(jestConfig) {
    if (!jestConfig.watch && !jestConfig.watchAll) {
        await jest_dev_server_1.teardown();
    }
}
exports.teardown = teardown;
