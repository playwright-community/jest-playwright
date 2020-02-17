import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { CHROMIUM, FIREFOX, WEBKIT, DEFAULT_CONFIG } from './constants'

const exists = promisify(fs.exists)

const checkDependencies = dependencies => {
  if (!dependencies) return null
  if (dependencies.playwright) return 'playwright'
  if (dependencies[`playwright-${CHROMIUM}`]) return `playwright-${CHROMIUM}`
  if (dependencies[`playwright-${FIREFOX}`]) return `playwright-${FIREFOX}`
  if (dependencies[`playwright-${WEBKIT}`]) return `playwright-${WEBKIT}`
  return null
}

export function checkBrowserEnv(param) {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      `Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
    )
  }
}

export function checkDeviceEnv(device, availableDevices) {
  if (!availableDevices.includes(device)) {
    throw new Error(
      `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
    )
  }
}

export function getDeviceType(config) {
  const processDevice = process.env.DEVICE
  if (processDevice) {
    return processDevice
  }
  return config.device
}

export function getBrowserType(config) {
  const processBrowser = process.env.BROWSER
  if (processBrowser) {
    return processBrowser
  }
  return config.browser || CHROMIUM
}

export async function readPackage() {
  const packagePath = 'package.json'
  const absConfigPath = path.resolve(process.cwd(), packagePath)
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const packageConfig = await require(absConfigPath)
  // for handling the local tests
  if (packageConfig.name === 'jest-playwright-preset') {
    return 'playwright'
  }
  const playwright =
    checkDependencies(packageConfig.dependencies) ||
    checkDependencies(packageConfig.devDependencies)
  if (!playwright) {
    throw new Error('None of playwright packages was not found in dependencies')
  }
  return playwright
}

export async function getPlaywrightInstance(browserType) {
  const playwrightPackage = await readPackage()

  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(playwrightPackage)[browserType]
}

export async function readConfig() {
  const defaultConfig = DEFAULT_CONFIG

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
    return defaultConfig
  }

  // eslint-disable-next-line global-require,import/no-dynamic-require
  const localConfig = await require(absConfigPath)
  return {
    ...defaultConfig,
    ...localConfig,
    launchBrowserApp: {
      ...defaultConfig.launchBrowserApp,
      ...(localConfig.launchBrowserApp || {}),
    },
    context: {
      ...defaultConfig.context,
      ...(localConfig.context || {}),
    },
  }
}
