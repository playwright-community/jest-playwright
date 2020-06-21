import { Config } from './types'

export const IMPORT_KIND_PLAYWRIGHT = 'playwright'

export const CHROMIUM = 'chromium'
export const FIREFOX = 'firefox'
export const WEBKIT = 'webkit'

export const DEFAULT_CONFIG: Config = {
  launchOptions: {},
  contextOptions: {},
  browsers: [CHROMIUM],
  devices: [],
  exitOnPageError: true,
}

export const DEFAULT_TEST_PLAYWRIGHT_TIMEOUT = 15000

export const PACKAGE_NAME = 'jest-playwright-preset'
