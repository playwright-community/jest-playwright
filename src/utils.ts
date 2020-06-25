import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import type {
  BrowserType,
  DeviceType,
  JestPlaywrightConfig,
  Playwright,
  PlaywrightRequireType,
  Options,
} from './types'
import {
  CHROMIUM,
  DEFAULT_CONFIG,
  FIREFOX,
  IMPORT_KIND_PLAYWRIGHT,
  WEBKIT,
  PACKAGE_NAME,
} from './constants'

const exists = promisify(fs.exists)

export const checkBrowserEnv = (param: BrowserType): void => {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      formatError(
        `Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
      ),
    )
  }
}

export const checkDeviceEnv = (
  device: string,
  availableDevices: string[],
): void => {
  if (!availableDevices.includes(device)) {
    throw new Error(
      formatError(
        `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
      ),
    )
  }
}

export const getDisplayName = (
  browser: BrowserType,
  device: DeviceType,
): string => {
  if (device !== null) {
    if (typeof device === 'string') {
      return `browser: ${browser} device: ${device}`
    }
    if (device.name) {
      return `browser: ${browser} device: ${device.name}`
    }
  }
  return `browser: ${browser}`
}

export const getDeviceType = (device: DeviceType): DeviceType => {
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

export const getPlaywrightInstance = (browserName: BrowserType): Playwright => {
  let pw
  let name: PlaywrightRequireType
  try {
    pw = require(`${IMPORT_KIND_PLAYWRIGHT}-${browserName}`)
    name = browserName
  } catch (e) {
    try {
      pw = require(IMPORT_KIND_PLAYWRIGHT)
      name = IMPORT_KIND_PLAYWRIGHT
    } catch (e) {
      throw new Error(
        formatError(`Cannot find playwright package to use ${browserName}`),
      )
    }
  }
  if (!pw[browserName]) {
    throw new Error(
      formatError(`Cannot find playwright package to use ${browserName}`),
    )
  }
  return {
    name,
    instance: pw[browserName],
    devices: pw['devices'],
  }
}

const validateConfig = (config: JestPlaywrightConfig) => {
  const renamings = [
    {
      from: 'launchBrowserApp',
      to: 'launchOptions',
    },
    {
      from: 'connectBrowserApp',
      to: 'connectOptions',
    },
    {
      from: 'context',
      to: 'contextOptions',
    },
    {
      from: 'server',
      to: 'serverOptions',
    },
  ]
  const hasError = renamings.some(({ from, to }) => {
    if (from in config) {
      console.warn(
        formatError(`"${from}" was renamed to "${to}" in version 1.0`),
      )
      return true
    }
    return false
  })
  if (hasError) {
    throw new Error(formatError('Validation error occurred'))
  }
}

export function getBrowserOptions<T>(
  browserName: BrowserType,
  options?: Options<T>,
): T {
  if (options && options[browserName]) {
    const result = { ...options, ...options[browserName] }
    ;[CHROMIUM, FIREFOX, WEBKIT].forEach((browser) => {
      delete result[browser as BrowserType]
    })
    return result
  }
  return options as T
}

export const readConfig = async (
  rootDir: string = process.cwd(),
): Promise<JestPlaywrightConfig> => {
  const hasCustomConfigPath = !!process.env.JEST_PLAYWRIGHT_CONFIG
  const configPath =
    process.env.JEST_PLAYWRIGHT_CONFIG || 'jest-playwright.config.js'
  const absConfigPath = path.resolve(rootDir, configPath)
  const configExists = await exists(absConfigPath)

  if (hasCustomConfigPath && !configExists) {
    throw new Error(
      formatError(
        `Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`,
      ),
    )
  }

  if (!hasCustomConfigPath && !configExists) {
    return DEFAULT_CONFIG
  }

  const localConfig = await require(absConfigPath)
  validateConfig(localConfig)
  return {
    ...DEFAULT_CONFIG,
    ...localConfig,
    launchOptions: {
      ...DEFAULT_CONFIG.launchOptions,
      ...(localConfig.launchOptions || {}),
    },
    contextOptions: {
      ...DEFAULT_CONFIG.contextOptions,
      ...(localConfig.contextOptions || {}),
    },
  }
}

export const formatError = (error: string): string =>
  `${PACKAGE_NAME}: ${error}`
