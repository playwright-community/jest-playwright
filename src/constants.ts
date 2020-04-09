import {
  BrowserTypeLaunchOptions,
  BrowserNewContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrighBrowserType,
  BrowserTypeConnectOptions,
} from 'playwright-core'
import { JestDevServerOptions } from 'jest-dev-server'

export const IMPORT_KIND_PLAYWRIGHT = 'playwright'

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

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

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
  connectBrowserApp?: BrowserTypeConnectOptions
  USE_NEW_API?: boolean
}

export const DEFAULT_CONFIG: Config = {
  launchBrowserApp: {},
  context: {},
  browser: CHROMIUM,
  exitOnPageError: true,
}

// Utils
export type InitializerProps = {
  browser: BrowserType
  device?: string
}

export type RootProxy = {
  [key: string]: any
}

export type Initializer = (args: InitializerProps) => Promise<any>
export type Args = (string | Function)[]
