"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEST_PLAYWRIGHT_TIMEOUT = exports.DEFAULT_CONFIG = exports.WEBKIT = exports.FIREFOX = exports.CHROMIUM = exports.IMPORT_KIND_PLAYWRIGHT = void 0;
exports.IMPORT_KIND_PLAYWRIGHT = 'playwright';
exports.CHROMIUM = 'chromium';
exports.FIREFOX = 'firefox';
exports.WEBKIT = 'webkit';
exports.DEFAULT_CONFIG = {
    launchBrowserApp: {},
    context: {},
    browsers: [exports.CHROMIUM],
    devices: [],
    exitOnPageError: true,
};
exports.DEFAULT_TEST_PLAYWRIGHT_TIMEOUT = 15000;
