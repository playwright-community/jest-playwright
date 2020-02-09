import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { CHROMIUM, FIREFOX, WEBKIT, DEFAULT_CONFIG } from './constants'

const exists = promisify(fs.exists)

export function checkBrowserEnv(param) {
  if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
    throw new Error(
      `Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`,
    )
  }
}

export function getBrowserType(config) {
  const processBrowser = process.env.BROWSER
  if (processBrowser) {
    return processBrowser
  }
  return config.browser || CHROMIUM
}

export function getPlaywrightInstance(
  browserType,
  useStandaloneVersion = process.env.USE_STANDALONE_VERSION,
) {
  if (useStandaloneVersion) {
    const playwrightPackage = `playwright-${browserType}`
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(playwrightPackage)
    } catch (e) {
      throw new Error(`You need to install ${playwrightPackage}`)
    }
  }
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  return require('playwright')[browserType]
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
