import {
  BrowserTypeLaunchOptions,
  BrowserNewContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrighBrowserType,
} from 'playwright-core'
import { JestDevServerOptions } from 'jest-dev-server'

export const CORE = 'core'
export const PLAYWRIGHT = 'playwright'

export const CHROMIUM = 'chromium'
export const FIREFOX = 'firefox'
export const WEBKIT = 'webkit'

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type GenericBrowser = PlaywrighBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

export type SelectorType = {
  script: string | Function | { path?: string; content?: string }
  name: string
}

export type PlaywrightRequireType =
  | BrowserType
  | typeof PLAYWRIGHT
  | typeof CORE

export interface Config {
  launchBrowserApp?: BrowserTypeLaunchOptions
  context?: BrowserNewContextOptions
  exitOnPageError: boolean
  browser?: BrowserType
  browsers?: BrowserType[]
  device?: string
  devices?: string[]
  server?: JestDevServerOptions
  selectors?: SelectorType[]
}

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browser: CHROMIUM,
  exitOnPageError: true,
}
