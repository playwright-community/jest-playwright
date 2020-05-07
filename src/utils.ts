import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import {
  BrowserType,
  CHROMIUM,
  Config,
  DEFAULT_CONFIG,
  FIREFOX,
  IMPORT_KIND_PLAYWRIGHT,
  PlaywrightRequireType,
  WEBKIT,
  GenericBrowser,
} from './constants'

const exists = promisify(fs.exists)

const checkDependencies = (
  dependencies: Record<string, string>,
): PlaywrightRequireType | null => {
  if (!dependencies) return null
  if (dependencies.playwright) return IMPORT_KIND_PLAYWRIGHT
  if (dependencies[`playwright-${CHROMIUM}`]) return CHROMIUM
  if (dependencies[`playwright-${FIREFOX}`]) return FIREFOX
  if (dependencies[`playwright-${WEBKIT}`]) return WEBKIT
  return null
}

export const checkBrowserEnv = (param: BrowserType): void => {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      `Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
    )
  }
}

export const checkDeviceEnv = (
  device: string,
  availableDevices: string[],
): void => {
  if (!availableDevices.includes(device)) {
    throw new Error(
      `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
    )
  }
}

export const getDisplayName = (
  browser: BrowserType,
  device: string | null,
): string => {
  return `browser: ${browser}${device ? ` device: ${device}` : ''}`
}

export const getDeviceType = (device?: string): string | undefined => {
  const processDevice = process.env.DEVICE
  if (processDevice) {
    return processDevice
  }
  return device
}

export const getBrowserType = (browser?: BrowserType): BrowserType => {
  const processBrowser = process.env.BROWSER
  if (processBrowser) {
    return processBrowser as BrowserType
  }
  return browser || CHROMIUM
}

export const readPackage = async (): Promise<PlaywrightRequireType> => {
  const packagePath = 'package.json'
  const absConfigPath = path.resolve(process.cwd(), packagePath)
  const packageConfig = await require(absConfigPath)
  // for handling the local tests
  if (packageConfig.name === 'jest-playwright-preset') {
    return IMPORT_KIND_PLAYWRIGHT
  }
  const playwright =
    checkDependencies(packageConfig.dependencies) ||
    checkDependencies(packageConfig.devDependencies)
  if (!playwright) {
    throw new Error('None of playwright packages was not found in dependencies')
  }
  return playwright
}

export const getPlaywrightInstance = async (
  playwrightPackage: PlaywrightRequireType,
  browserType: BrowserType,
): Promise<GenericBrowser> => {
  if (playwrightPackage === IMPORT_KIND_PLAYWRIGHT) {
    return require('playwright')[browserType]
  }
  return require(`playwright-${playwrightPackage}`)[playwrightPackage]
}

export const readConfig = async (
  rootDir: string = process.cwd(),
): Promise<Config> => {
  const hasCustomConfigPath = !!process.env.JEST_PLAYWRIGHT_CONFIG
  const configPath =
    process.env.JEST_PLAYWRIGHT_CONFIG || 'jest-playwright.config.js'
  const absConfigPath = path.resolve(rootDir, configPath)
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
