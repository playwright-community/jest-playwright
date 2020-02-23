import { LaunchOptions } from 'playwright-core/lib/server/browserType'
import { BrowserContextOptions } from 'playwright-core/lib/browserContext'

export type BrowserType = "chromium" | "firefox" | "webkit";

export const CHROMIUM: BrowserType = 'chromium'
export const FIREFOX: BrowserType = 'firefox'
export const WEBKIT: BrowserType = 'webkit'

export const PARALLEL: string = '--parallel'

export interface Config {
  launchBrowserApp?: LaunchOptions
  context?: BrowserContextOptions,
  exitOnPageError: boolean,
  browser?: BrowserType
  browsers?: BrowserType[]
  device?: string
  server?: any
}

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browser: CHROMIUM,
  exitOnPageError: true,
}

