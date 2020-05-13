import type {
  BrowserTypeLaunchOptions,
  BrowserNewContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrightBrowserType,
  BrowserTypeConnectOptions,
} from 'playwright-core'
import type { JestDevServerOptions } from 'jest-dev-server'
import { CHROMIUM, FIREFOX, IMPORT_KIND_PLAYWRIGHT, WEBKIT } from './constants'

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
