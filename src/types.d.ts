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

export type DeviceType = string | null

export type Packages = Partial<Record<BrowserType, BrowserType>>

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

type SelectorFunction = (...args: any[]) => void

export type SelectorType = {
  script: string | SelectorFunction | { path?: string; content?: string }
  name: string
}

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

export interface Playwright {
  name: PlaywrightRequireType
  instance: GenericBrowser
  devices: typeof devices
}

export interface Config {
  launchOptions?: LaunchOptions
  contextOptions?: BrowserContextOptions
  exitOnPageError: boolean
  browsers: BrowserType[]
  devices?: string[]
  serverOptions?: JestProcessManagerOptions
  selectors?: SelectorType[]
  connectOptions?: Parameters<GenericBrowser['connect']>[0]
}

export interface JestPlaywrightConfig extends JestConfig.ProjectConfig {
  browserName: BrowserType
  wsEndpoint: string
  device: DeviceType
}

interface JestPlaywrightContext extends Context {
  config: JestPlaywrightConfig
}

export interface JestPlaywrightTest extends Test {
  context: JestPlaywrightContext
}
