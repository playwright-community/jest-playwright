"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = exports.getPlaywrightInstance = exports.readPackage = exports.getBrowserType = exports.getDeviceType = exports.getDisplayName = exports.checkDeviceEnv = exports.checkBrowserEnv = exports.checkDependencies = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const constants_1 = require("./constants");
const exists = util_1.promisify(fs_1.default.exists);
exports.checkDependencies = (dependencies) => {
    if (!dependencies)
        return null;
    if (dependencies.playwright)
        return constants_1.IMPORT_KIND_PLAYWRIGHT;
    if (dependencies[`playwright-${constants_1.CHROMIUM}`])
        return constants_1.CHROMIUM;
    if (dependencies[`playwright-${constants_1.FIREFOX}`])
        return constants_1.FIREFOX;
    if (dependencies[`playwright-${constants_1.WEBKIT}`])
        return constants_1.WEBKIT;
    return null;
};
exports.checkBrowserEnv = (param) => {
    if (param !== constants_1.CHROMIUM && param !== constants_1.FIREFOX && param !== constants_1.WEBKIT) {
        throw new Error(`Wrong browser type. Should be one of [${constants_1.CHROMIUM}, ${constants_1.FIREFOX}, ${constants_1.WEBKIT}], but got ${param}`);
    }
};
exports.checkDeviceEnv = (device, availableDevices) => {
    if (!availableDevices.includes(device)) {
        throw new Error(`Wrong device. Should be one of [${availableDevices}], but got ${device}`);
    }
};
exports.getDisplayName = (browser, device) => {
    return `browser: ${browser}${device ? ` device: ${device}` : ''}`;
};
exports.getDeviceType = (device) => {
    const processDevice = process.env.DEVICE;
    if (processDevice) {
        return processDevice;
    }
    return device;
};
exports.getBrowserType = (browser) => {
    const processBrowser = process.env.BROWSER;
    if (processBrowser) {
        return processBrowser;
    }
    return browser || constants_1.CHROMIUM;
};
exports.readPackage = async () => {
    const packagePath = 'package.json';
    const absConfigPath = path_1.default.resolve(process.cwd(), packagePath);
    const packageConfig = await require(absConfigPath);
    // for handling the local tests
    if (packageConfig.name === 'jest-playwright-preset') {
        return constants_1.IMPORT_KIND_PLAYWRIGHT;
    }
    const playwright = exports.checkDependencies(packageConfig.dependencies) ||
        exports.checkDependencies(packageConfig.devDependencies);
    if (!playwright) {
        throw new Error('None of playwright packages was not found in dependencies');
    }
    return playwright;
};
exports.getPlaywrightInstance = (playwrightPackage, browserName) => {
    const buildPlaywrightStructure = (importName) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pw = require(importName);
        return {
            instance: pw[browserName],
            devices: pw['devices'],
        };
    };
    if (playwrightPackage === constants_1.IMPORT_KIND_PLAYWRIGHT) {
        return buildPlaywrightStructure('playwright');
    }
    return buildPlaywrightStructure(`playwright-${playwrightPackage}`);
};
exports.readConfig = async (rootDir = process.cwd()) => {
    const hasCustomConfigPath = !!process.env.JEST_PLAYWRIGHT_CONFIG;
    const configPath = process.env.JEST_PLAYWRIGHT_CONFIG || 'jest-playwright.config.js';
    const absConfigPath = path_1.default.resolve(rootDir, configPath);
    const configExists = await exists(absConfigPath);
    if (hasCustomConfigPath && !configExists) {
        throw new Error(`Error: Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`);
    }
    if (!hasCustomConfigPath && !configExists) {
        return constants_1.DEFAULT_CONFIG;
    }
    const localConfig = await require(absConfigPath);
    return {
        ...constants_1.DEFAULT_CONFIG,
        ...localConfig,
        launchBrowserApp: {
            ...constants_1.DEFAULT_CONFIG.launchBrowserApp,
            ...(localConfig.launchBrowserApp || {}),
        },
        context: {
            ...constants_1.DEFAULT_CONFIG.context,
            ...(localConfig.context || {}),
        },
    };
};
