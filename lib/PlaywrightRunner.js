"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_runner_1 = __importDefault(require("jest-runner"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const getBrowserTest = (test, browser, device) => {
    const { displayName } = test.context.config;
    const playwrightDisplayName = utils_1.getDisplayName(browser, device);
    return {
        ...test,
        context: {
            ...test.context,
            config: {
                ...test.context.config,
                // @ts-ignore
                browserName: browser,
                device,
                displayName: {
                    name: displayName
                        ? `${playwrightDisplayName} ${typeof displayName === 'string' ? displayName : displayName.name}`
                        : playwrightDisplayName,
                    color: 'yellow',
                },
            },
        },
    };
};
const getTests = async (tests) => {
    const playwrightPackage = await utils_1.readPackage();
    const pwTests = [];
    await Promise.all(tests.map(async (test) => {
        const { rootDir } = test.context.config;
        const { browsers, devices } = await utils_1.readConfig(rootDir);
        browsers.forEach((browser) => {
            utils_1.checkBrowserEnv(browser);
            const { devices: availableDevices } = utils_1.getPlaywrightInstance(playwrightPackage, browser);
            if (devices && devices.length) {
                devices.forEach((device) => {
                    const availableDeviceNames = Object.keys(availableDevices);
                    utils_1.checkDeviceEnv(device, availableDeviceNames);
                    pwTests.push(getBrowserTest(test, browser, device));
                });
            }
            else {
                pwTests.push(getBrowserTest(test, browser, null));
            }
        });
    }));
    return pwTests;
};
class PlaywrightRunner extends jest_runner_1.default {
    constructor(globalConfig, context) {
        const config = { ...globalConfig };
        // Set default timeout to 15s
        config.testTimeout = config.testTimeout || constants_1.DEFAULT_TEST_PLAYWRIGHT_TIMEOUT;
        super(config, context);
    }
    async runTests(tests, watcher, onStart, onResult, onFailure, options) {
        const browserTests = await getTests(tests);
        return await (options.serial
            ? this['_createInBandTestRun'](browserTests, watcher, onStart, onResult, onFailure)
            : this['_createParallelTestRun'](browserTests, watcher, onStart, onResult, onFailure));
    }
}
exports.default = PlaywrightRunner;
