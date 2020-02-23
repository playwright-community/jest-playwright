import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { CHROMIUM, FIREFOX, WEBKIT, DEFAULT_CONFIG, Config, BrowserType } from './constants'

const exists = promisify(fs.exists)

const checkDependencies = (dependencies: Record<string, string>) => {
  if (!dependencies) return null
  if (dependencies.playwright) return 'playwright'
  if (dependencies['playwright-core']) return 'core'
  if (dependencies[`playwright-${CHROMIUM}`]) return CHROMIUM
  if (dependencies[`playwright-${FIREFOX}`]) return FIREFOX
  if (dependencies[`playwright-${WEBKIT}`]) return WEBKIT
  return null
}

export function checkBrowserEnv(param: BrowserType) {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      `Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
    )
  }
}

export function checkDeviceEnv(device: string, availableDevices: string[]) {
  if (!availableDevices.includes(device)) {
    throw new Error(
      `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
    )
  }
}

export function getDeviceType(config: Config) {
  const processDevice = process.env.DEVICE
  if (processDevice) {
    return processDevice
  }
  return config.device
}

export function getBrowserType(config: Config) {
  const processBrowser = process.env.BROWSER
  if (processBrowser) {
    return processBrowser
  }
  return config.browser || CHROMIUM
}

export async function readPackage() {
  const packagePath = 'package.json'
  const absConfigPath = path.resolve(process.cwd(), packagePath)
  const packageConfig = await require(absConfigPath)
  // for handling the local tests
  if (packageConfig.name === 'jest-playwright-preset') {
    return 'core'
  }
  const playwright =
    checkDependencies(packageConfig.dependencies) ||
    checkDependencies(packageConfig.devDependencies)
  if (!playwright) {
    throw new Error('None of playwright packages was not found in dependencies')
  }
  return playwright
}

export async function getPlaywrightInstance(browserType: BrowserType) {
  const playwrightPackage = await readPackage()
  if (playwrightPackage === 'playwright') {
    return require('playwright')[browserType]
  }
  if (playwrightPackage === 'core') {
    const browser = require('playwright-core')[browserType]
    await browser.downloadBrowserIfNeeded()
    return browser
  }
  return require(`playwright-${playwrightPackage}`)[playwrightPackage]
}

export async function readConfig(): Promise<Config> {
  const hasCustomConfigPath = !!process.env.JEST_PLAYWRIGHT_CONFIG
  const configPath =
    process.env.JEST_PLAYWRIGHT_CONFIG || 'jest-playwright.config.js'
  const absConfigPath = path.resolve(process.cwd(), configPath)
  const configExists = await exists(absConfigPath)

  if (hasCustomConfigPath && !configExists) {
    throw new Error(
      `Error: Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`,
    )
  }

  if (!hasCustomConfigPath && !configExists) {
    return DEFAULT_CONFIG
  }

  const localConfig = await require(absConfigPath)
  return {
    ...DEFAULT_CONFIG,
    ...localConfig,
    launchBrowserApp: {
      ...DEFAULT_CONFIG.launchBrowserApp,
      ...(localConfig.launchBrowserApp || {}),
    },
    context: {
      ...DEFAULT_CONFIG.context,
      ...(localConfig.context || {}),
    },
  }
}
