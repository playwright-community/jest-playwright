import { LaunchOptions } from 'playwright-core/lib/server/browserType'
import { BrowserContextOptions } from 'playwright-core/lib/browserContext'
export const CHROMIUM = 'chromium'
export const FIREFOX = 'firefox'
export const WEBKIT = 'webkit'

export const PARALLEL = '--parallel'

export interface Config {
  launchBrowserApp?: LaunchOptions
  context?: BrowserContextOptions,
  exitOnPageError: boolean,
  browser?: string
  browsers?: string[]
  device?: string
  server: any
}

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browser: CHROMIUM,
  exitOnPageError: true,
}

