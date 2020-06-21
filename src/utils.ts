import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import type {
  BrowserType,
  DeviceType,
  Config,
  Playwright,
  Packages,
} from './types'
import {
  CHROMIUM,
  DEFAULT_CONFIG,
  FIREFOX,
  IMPORT_KIND_PLAYWRIGHT,
  WEBKIT,
} from './constants'

const exists = promisify(fs.exists)

export const checkDependencies = (
  dependencies: Record<string, string>,
): Packages | typeof IMPORT_KIND_PLAYWRIGHT | null => {
  const packages: Packages = {}
  if (!dependencies || Object.keys(dependencies).length === 0) return null
  if (dependencies.playwright) return IMPORT_KIND_PLAYWRIGHT
  if (dependencies[`playwright-${CHROMIUM}`]) {
    packages[CHROMIUM] = CHROMIUM
  }
  if (dependencies[`playwright-${FIREFOX}`]) {
    packages[FIREFOX] = FIREFOX
  }
  if (dependencies[`playwright-${WEBKIT}`]) {
    packages[WEBKIT] = WEBKIT
  }
  if (Object.keys(packages).length === 0) {
    return null
  }
  return packages
}

export const checkBrowserEnv = (param: BrowserType): void => {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      `jest-playwright-preset: Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
    )
  }
}

export const checkDeviceEnv = (
  device: string,
  availableDevices: string[],
): void => {
  if (!availableDevices.includes(device)) {
    throw new Error(
      `jest-playwright-preset: Wrong device. Should be one of [${availableDevices}], but got ${device}`,
    )
  }
}

export const getDisplayName = (
  browser: BrowserType,
  device: DeviceType,
): string => {
  return `browser: ${browser}${device ? ` device: ${device}` : ''}`
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

export const readPackage = async (): Promise<
  Packages | typeof IMPORT_KIND_PLAYWRIGHT
> => {
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
  if (playwright === null) {
    throw new Error(
      'jest-playwright-preset: None of playwright packages was not found in dependencies',
    )
  }
  return playwright
}

export const getPlaywrightInstance = (
  playwrightPackage: typeof IMPORT_KIND_PLAYWRIGHT | Packages,
  browserName: BrowserType,
): Playwright => {
  const buildPlaywrightStructure = (importName: string): Playwright => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pw = require(importName)
    return {
      instance: pw[browserName],
      devices: pw['devices'],
    }
  }
  if (playwrightPackage === IMPORT_KIND_PLAYWRIGHT) {
    return buildPlaywrightStructure('playwright')
  }
  if (!playwrightPackage[browserName]) {
    throw new Error(
      'jest-playwright-preset: Cannot find provided playwright package',
    )
  }
  return buildPlaywrightStructure(
    `playwright-${playwrightPackage[browserName]}`,
  )
}

const validateConfig = (config: Config) => {
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
        `jest-playwright-preset: "${from}" was renamed to "${to}" in version 1.0`,
      )
      return true
    }
    return false
  })
  if (hasError) {
    throw new Error('jest-playwright-preset: validation error occurred')
  }
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
      `jest-playwright-preset: Error: Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`,
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
