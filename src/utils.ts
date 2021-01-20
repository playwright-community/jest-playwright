import fs from 'fs'
import path from 'path'
import type {
  BrowserType,
  ConfigDeviceType,
  DeviceType,
  JestPlaywrightConfig,
  Playwright,
  PlaywrightRequireType,
  SkipOption,
  Options,
  Nullable,
} from '../types/global'
import {
  CHROMIUM,
  DEFAULT_CONFIG,
  FIREFOX,
  IMPORT_KIND_PLAYWRIGHT,
  WEBKIT,
  PACKAGE_NAME,
  CONFIG_ENVIRONMENT_NAME,
} from './constants'

const fsPromises = fs.promises
const BROWSERS = [CHROMIUM, FIREFOX, WEBKIT]

class PlaywrightError extends Error {
  constructor(message: string) {
    super(formatError(message))
    this.name = 'PlaywrightError'
  }
}

export const checkBrowserEnv = (param: BrowserType): void => {
  if (!BROWSERS.includes(param)) {
    throw new PlaywrightError(
      `Wrong browser type. Should be one of [${BROWSERS.join(
        ', ',
      )}], but got ${param}`,
    )
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any*/
const isObject = (item: any) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: T,
): T => {
  let output = { ...target }
  const keys: (keyof T)[] = Object.keys(source)
  if (isObject(target) && isObject(source)) {
    keys.forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output = { ...output, [key]: source[key] }
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        output = { ...output, [key]: source[key] }
      }
    })
  }
  return output
}

export const checkDeviceEnv = (
  device: string,
  availableDevices: string[],
): void => {
  if (!availableDevices.includes(device)) {
    throw new PlaywrightError(
      `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
    )
  }
}

export const checkDevice = (
  device: DeviceType,
  availableDevices: Playwright['devices'],
): void => {
  if (typeof device === 'string') {
    const availableDeviceNames = Object.keys(availableDevices)
    checkDeviceEnv(device, availableDeviceNames)
  }
}

export const getDisplayName = (browser: string, device: DeviceType): string => {
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
  return processDevice || device
}

export const getBrowserType = (browser?: BrowserType): BrowserType => {
  const processBrowser = process.env.BROWSER
  if (processBrowser) {
    return processBrowser as BrowserType
  }
  return browser || CHROMIUM
}

export const getDeviceBrowserType = (
  device: ConfigDeviceType,
  availableDevices: Playwright['devices'],
): BrowserType => {
  if (typeof device === 'string') {
    return availableDevices[device].defaultBrowserType as BrowserType
  }

  return device?.defaultBrowserType || CHROMIUM
}

export const getPlaywrightInstance = (
  browserName?: BrowserType,
): Playwright => {
  let pw
  let name: PlaywrightRequireType
  if (!browserName) {
    pw = require(IMPORT_KIND_PLAYWRIGHT)
    name = IMPORT_KIND_PLAYWRIGHT
    return {
      name,
      instance: pw,
      devices: pw['devices'],
    }
  }
  try {
    pw = require(`${IMPORT_KIND_PLAYWRIGHT}-${browserName}`)
    name = browserName
  } catch (e) {
    try {
      pw = require(IMPORT_KIND_PLAYWRIGHT)
      name = IMPORT_KIND_PLAYWRIGHT
    } catch (e) {
      throw new PlaywrightError(
        `Cannot find playwright package to use ${browserName}`,
      )
    }
  }
  if (!pw[browserName]) {
    throw new PlaywrightError(
      `Cannot find playwright package to use ${browserName}`,
    )
  }
  return {
    name,
    instance: pw[browserName],
    devices: pw['devices'],
  }
}

export function getBrowserOptions<T>(
  browserName: BrowserType,
  options?: Options<T>,
): T {
  let result: Options<T> | undefined = options
  if (result) {
    if (result[browserName]) {
      result = { ...result, ...result[browserName] }
    }
    BROWSERS.forEach((browser) => {
      delete result![browser as BrowserType]
    })
    return result
  }
  return result as T
}

export const getSkipFlag = (
  skipOptions: SkipOption,
  browserName: BrowserType,
  deviceName: Nullable<string>,
): boolean => {
  const { browsers, devices } = skipOptions
  const isBrowserIncluded = browsers.includes(browserName)
  if (!devices) {
    return isBrowserIncluded
  } else {
    if (devices instanceof RegExp) {
      return isBrowserIncluded && devices.test(deviceName!)
    }
    return isBrowserIncluded && devices.includes(deviceName!)
  }
}

export const readConfig = async (
  rootDir: string = process.cwd(),
  jestEnvConfig?: JestPlaywrightConfig,
): Promise<JestPlaywrightConfig> => {
  if (jestEnvConfig) {
    return deepMerge<JestPlaywrightConfig>(DEFAULT_CONFIG, jestEnvConfig)
  }
  const hasCustomConfigPath = !!process.env.JEST_PLAYWRIGHT_CONFIG
  let fileExtension = 'js'
  if (process.env.npm_package_type === 'module') {
    fileExtension = 'cjs'
  }
  const configPath =
    process.env.JEST_PLAYWRIGHT_CONFIG ||
    `${CONFIG_ENVIRONMENT_NAME}.config.${fileExtension}`
  const absConfigPath = path.resolve(rootDir, configPath)
  let configExists = true
  try {
    await fsPromises.access(absConfigPath)
  } catch (e) {
    configExists = false
  }

  if (hasCustomConfigPath && !configExists) {
    throw new PlaywrightError(
      `Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`,
    )
  }

  if (!hasCustomConfigPath && !configExists) {
    return DEFAULT_CONFIG
  }

  const localConfig = await require(absConfigPath)
  return deepMerge<JestPlaywrightConfig>(DEFAULT_CONFIG, localConfig)
}

export const formatError = (error: string): string =>
  `${PACKAGE_NAME}: ${error}`
