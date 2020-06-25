import type {
  LaunchOptions,
  BrowserContextOptions,
  WebKitBrowser,
  ChromiumBrowser,
  FirefoxBrowser,
  BrowserType as PlaywrightBrowserType,
  devices,
} from 'playwright-core'
import type { Config as JestConfig } from '@jest/types'
import type { Context } from 'jest-runner/build/types'
import type { Test } from 'jest-runner'
import type { JestProcessManagerOptions } from 'jest-process-manager'
import { CHROMIUM, FIREFOX, IMPORT_KIND_PLAYWRIGHT, WEBKIT } from './constants'

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type CustomDeviceType = BrowserContextOptions & {
  name: string
}

export type DeviceType = CustomDeviceType | string | null

export type Packages = Partial<Record<BrowserType, BrowserType>>

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

export type SelectorType = {
  script: string | Function | { path?: string; content?: string }
  name: string
}

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

export interface Playwright {
  name: PlaywrightRequireType
  instance: GenericBrowser
  devices: typeof devices
}

type Options<T> = T & Partial<Record<BrowserType, T>>

type ConnectOptions = Parameters<GenericBrowser['connect']>[0]

export interface JestPlaywrightConfig {
  launchOptions?: Options<LaunchOptions>
  connectOptions?: Options<ConnectOptions>
  contextOptions?: Options<BrowserContextOptions>
  exitOnPageError: boolean
  browsers: BrowserType[]
  devices?: (string | CustomDeviceType)[]
  serverOptions?: JestProcessManagerOptions
  selectors?: SelectorType[]
  collectCoverage: boolean
}

export interface JestPlaywrightJestConfig extends JestConfig.ProjectConfig {
  browserName: BrowserType
  wsEndpoint: string
  device: DeviceType
}

interface JestPlaywrightContext extends Context {
  config: JestPlaywrightJestConfig
}

export interface JestPlaywrightTest extends Test {
  context: JestPlaywrightContext
}
