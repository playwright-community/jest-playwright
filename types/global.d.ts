import {
  Browser,
  BrowserContext,
  Page,
  BrowserContextOptions,
  LaunchOptions,
  BrowserType as PlaywrightBrowserType,
  ViewportSize,
  ChromiumBrowser,
  FirefoxBrowser,
  WebKitBrowser,
  devices,
} from 'playwright-core'
import { Config as JestConfig } from '@jest/types'
import { Context } from 'jest-runner/build/types'
import { Test } from 'jest-runner'
import { JestProcessManagerOptions } from 'jest-process-manager'

// TODO Find out flex ways to reuse constants
declare const IMPORT_KIND_PLAYWRIGHT = 'playwright'

declare const CHROMIUM = 'chromium'
declare const FIREFOX = 'firefox'
declare const WEBKIT = 'webkit'

declare const LAUNCH = 'LAUNCH'
declare const PERSISTENT = 'PERSISTENT'
declare const SERVER = 'SERVER'

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type SkipOption = {
  browsers: BrowserType[]
  devices?: string[] | RegExp
}

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

type ContextOptions = Parameters<GenericBrowser['connect']>[0]

interface JestPlaywright {
  /**
   * Reset global.page
   *
   * ```ts
   * it('should reset page', async () => {
   *   await jestPlaywright.resetPage()
   * })
   * ```
   */
  resetPage: () => Promise<void>
  /**
   * Reset global.context
   *
   * ```ts
   * it('should reset context', async () => {
   *   await jestPlaywright.resetContext()
   * })
   * ```
   */
  resetContext: (newOptions?: ContextOptions) => Promise<void>
  /**
   * Reset global.browser, global.context, and global.page
   *
   * ```ts
   * it('should reset page', async () => {
   *   await jestPlaywright.resetBrowser()
   * })
   * ```
   */
  resetBrowser: (newOptions?: ContextOptions) => Promise<void>
  /**
   * Suspends test execution and gives you opportunity to see what's going on in the browser
   * - Jest is suspended (no timeout)
   * - A debugger instruction to the Browser, if Playwright has been launched with { devtools: true } it will stop
   *
   * ```ts
   * it('should put test in debug mode', async () => {
   *   await jestPlaywright.debug()
   * })
   * ```
   */
  debug: () => Promise<void>
  /**
   * Saves the coverage to the disk which will only work if `collectCoverage`
   * in `jest-playwright.config.js` file is set to true. The merged coverage file
   * is then available in `.nyc_output/coverage.json`. Mostly its needed in the
   * `afterEach` handler like that:
   *
   * ```ts
   * afterEach(async () => {
   *   await jestPlaywright.saveCoverage(page)
   * })
   * ```
   */
  saveCoverage: (page: Page) => Promise<void>
  configSeparateEnv: (
    config: JestPlaywrightConfig,
    isDebug?: boolean,
  ) => Promise<ConfigParams>
}

interface JestParams<T> {
  (options: T, name: string, fn?: jest.ProvidesCallback, timeout?: number): void
}

interface JestPlaywrightTestDebug extends JestParams<JestPlaywrightConfig> {
  (name: string, fn?: jest.ProvidesCallback, timeout?: number): void
  skip: JestParams<JestPlaywrightConfig> | JestPlaywrightTestDebug
  only: JestParams<JestPlaywrightConfig> | JestPlaywrightTestDebug
}

interface JestPlaywrightTestConfig extends JestParams<JestPlaywrightConfig> {
  skip: JestParams<JestPlaywrightConfig> | JestPlaywrightTestConfig
  only: JestParams<JestPlaywrightConfig> | JestPlaywrightTestConfig
}

declare global {
  const browserName: BrowserType
  const deviceName: string | null
  const page: Page
  const browser: Browser
  const context: BrowserContext
  const jestPlaywright: JestPlaywright
  namespace jest {
    interface It {
      jestPlaywrightSkip: JestParams<SkipOption>
      jestPlaywrightDebug: JestPlaywrightTestDebug
      jestPlaywrightConfig: JestPlaywrightTestConfig
    }
  }
}

type DeviceDescriptor = {
  viewport: ViewportSize
  userAgent: string
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: BrowserType
}

export type CustomDeviceType = Partial<DeviceDescriptor> & {
  name: string
}

export type DeviceType = CustomDeviceType | string | null

export type WsEndpointType = string | null

export type SelectorType = {
  script: string | Function | { path?: string; content?: string }
  name: string
}

export type PlaywrightRequireType = BrowserType | typeof IMPORT_KIND_PLAYWRIGHT

export interface Playwright {
  name: PlaywrightRequireType
  instance: GenericBrowser | Record<BrowserType, GenericBrowser>
  devices: typeof devices
}

type LaunchType = typeof LAUNCH | typeof SERVER | typeof PERSISTENT

type Options<T> = T & Partial<Record<BrowserType, T>>

export type ConnectOptions = Parameters<GenericBrowser['connect']>[0]

export interface JestPlaywrightConfig {
  skipInitialization?: boolean
  debugOptions?: JestPlaywrightConfig
  launchType?: LaunchType
  launchOptions?: Options<LaunchOptions>
  connectOptions?: Options<ConnectOptions>
  contextOptions?: Options<BrowserContextOptions>
  userDataDir?: string
  exitOnPageError: boolean
  browsers: BrowserType[]
  devices?: (string | CustomDeviceType)[] | RegExp
  useDefaultBrowserType?: boolean
  serverOptions?: JestProcessManagerOptions
  selectors?: SelectorType[]
  collectCoverage: boolean
}

export interface JestPlaywrightProjectConfig extends JestConfig.ProjectConfig {
  browserName: BrowserType
  wsEndpoint: WsEndpointType
  device: DeviceType
}

interface JestPlaywrightContext extends Context {
  config: JestPlaywrightProjectConfig
}

export interface JestPlaywrightTest extends Test {
  context: JestPlaywrightContext
}

export interface BrowserTest {
  test: JestPlaywrightTest
  config: JestPlaywrightConfig
  browser: BrowserType
  wsEndpoint: WsEndpointType
  device: DeviceType
}

export type ConfigParams = {
  browser: Browser | BrowserContext | null
  context: BrowserContext
  page: Page
}
