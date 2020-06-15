import type {
  LaunchOptions,
  BrowserContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrightBrowserType,
  devices,
} from 'playwright-core'
import type { JestDevServerOptions } from 'jest-dev-server'
import { CHROMIUM, FIREFOX, IMPORT_KIND_PLAYWRIGHT, WEBKIT } from './constants'

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type Packages = {
  [CHROMIUM]?: typeof CHROMIUM
  [FIREFOX]?: typeof FIREFOX
  [WEBKIT]?: typeof WEBKIT
}

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

type SelectorFunction = (...args: any[]) => void

export type SelectorType = {
  script: string | SelectorFunction | { path?: string; content?: string }
  name: string
}

export interface Playwright {
  instance: GenericBrowser
  devices: typeof devices
}

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

export interface Config {
  launchBrowserApp?: LaunchOptions
  context?: BrowserContextOptions
  exitOnPageError: boolean
  browsers: BrowserType[]
  devices?: string[]
  server?: JestDevServerOptions
  selectors?: SelectorType[]
  connectBrowserApp?: Parameters<GenericBrowser['connect']>[0]
}
