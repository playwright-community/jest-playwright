import {
  BrowserTypeLaunchOptions,
  BrowserNewContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrightBrowserType,
  BrowserTypeConnectOptions,
} from 'playwright-core'
import { JestDevServerOptions } from 'jest-dev-server'

export const IMPORT_KIND_PLAYWRIGHT = 'playwright'

export const CHROMIUM = 'chromium'
export const FIREFOX = 'firefox'
export const WEBKIT = 'webkit'

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

export type SelectorType = {
  script: string | Function | { path?: string; content?: string }
  name: string
}

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

export interface Config {
  launchBrowserApp?: BrowserTypeLaunchOptions
  context?: BrowserNewContextOptions
  exitOnPageError: boolean
  browsers?: BrowserType[]
  devices?: string[]
  server?: JestDevServerOptions
  selectors?: SelectorType[]
  connectBrowserApp?: BrowserTypeConnectOptions
}

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browsers: [CHROMIUM],
  devices: [],
  exitOnPageError: true,
}
