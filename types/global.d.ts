import {
  Browser,
  BrowserContext,
  Page,
  BrowserContextOptions,
  LaunchOptions,
  ConnectOptions,
  ConnectOverCDPOptions,
  BrowserType as PlaywrightBrowserType,
  ViewportSize,
  ChromiumBrowser,
  FirefoxBrowser,
  WebKitBrowser,
  devices,
} from 'playwright-core'
import { Config as JestConfig } from '@jest/types'
import { Test } from 'jest-runner'
import { JestProcessManagerOptions } from 'jest-process-manager'

// TODO Find out flex ways to reuse constants
declare const IMPORT_KIND_PLAYWRIGHT = 'playwright'

declare const CONFIG_ENVIRONMENT_NAME = 'jest-playwright'

declare const CHROMIUM = 'chromium'
declare const FIREFOX = 'firefox'
declare const WEBKIT = 'webkit'

declare const LAUNCH = 'LAUNCH'
declare const PERSISTENT = 'PERSISTENT'
declare const SERVER = 'SERVER'

declare module 'jest-playwright-preset' {
  const globalSetup: (config: JestConfig.GlobalConfig) => void
  const globalTeardown: (config: JestConfig.GlobalConfig) => void
  const getPlaywrightEnv: (env?: string) => void
}

export type BrowserType = typeof CHROMIUM | typeof FIREFOX | typeof WEBKIT

export type SkipOption = {
  browsers: BrowserType[]
  devices?: string[] | RegExp
}

type Global = typeof globalThis

export interface JestPlaywrightGlobal extends Global {
  [CONFIG_ENVIRONMENT_NAME]: JestPlaywrightConfig
}

export interface TestPlaywrightConfigOptions extends JestPlaywrightConfig {
  browser?: BrowserType
  device?: ConfigDeviceType
}

export type GenericBrowser = PlaywrightBrowserType<
  WebKitBrowser | ChromiumBrowser | FirefoxBrowser
>

type Nullable<T> = T | null

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
  resetContext: (newOptions?: BrowserContextOptions) => Promise<void>
  /**
   * Reset global.browser, global.context, and global.page
   *
   * ```ts
   * it('should reset page', async () => {
   *   await jestPlaywright.resetBrowser()
   * })
   * ```
   */
  resetBrowser: (newOptions?: BrowserContextOptions) => Promise<void>
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
    config: Partial<TestPlaywrightConfigOptions>,
    isDebug?: boolean,
  ) => Promise<ConfigParams>
}

interface JestParams<T> {
  (options: T, name: string, fn?: jest.ProvidesCallback, timeout?: number): void
}

type ProvidesCallback = (cb: ConfigParams) => void

interface JestParamsWithConfigParams<T> {
  (
    options: Partial<T>,
    name: string,
    fn?: ProvidesCallback,
    timeout?: number,
  ): void
}

interface JestPlaywrightTestDebug
  extends JestParamsWithConfigParams<JestPlaywrightConfig> {
  (name: string, fn?: ProvidesCallback, timeout?: number): void
  skip:
    | JestParamsWithConfigParams<JestPlaywrightConfig>
    | JestPlaywrightTestDebug
  only:
    | JestParamsWithConfigParams<JestPlaywrightConfig>
    | JestPlaywrightTestDebug
}

interface JestPlaywrightTestConfig
  extends JestParamsWithConfigParams<JestPlaywrightConfig> {
  skip:
    | JestParamsWithConfigParams<JestPlaywrightConfig>
    | JestPlaywrightTestConfig
  only:
    | JestParamsWithConfigParams<JestPlaywrightConfig>
    | JestPlaywrightTestConfig
}

declare global {
  const browserName: BrowserType
  const deviceName: Nullable<string>
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
    interface Describe {
      jestPlaywrightSkip: JestParams<SkipOption>
    }
  }
}

type DeviceDescriptor = {
  viewport: Nullable<ViewportSize>
  userAgent: string
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: BrowserType
}

export type CustomDeviceType = Partial<DeviceDescriptor> & {
  name: string
}

export type ConfigDeviceType = CustomDeviceType | string

export type DeviceType = Nullable<ConfigDeviceType>

export type WsEndpointType = Nullable<string>

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

export type ServerOptions = JestProcessManagerOptions & {
  teardown?: string
}

export interface JestPlaywrightConfig {
  haveSkippedTests?: boolean
  skipInitialization?: boolean
  resetContextPerTest?: boolean
  testTimeout?: number
  debugOptions?: JestPlaywrightConfig
  launchType?: LaunchType
  launchOptions?: Options<LaunchOptions>
  connectOptions?: Options<
    (ConnectOptions & { wsEndpoint: string }) | ConnectOverCDPOptions
  >
  contextOptions?: Options<BrowserContextOptions>
  userDataDir?: string
  exitOnPageError?: boolean
  displayName?: string
  browsers: (BrowserType | (JestPlaywrightConfig & { name: BrowserType }))[]
  devices?: ConfigDeviceType[] | RegExp
  useDefaultBrowserType?: boolean
  serverOptions?: ServerOptions | ServerOptions[]
  selectors?: SelectorType[]
  collectCoverage?: boolean
}

export type JestPlaywrightProjectConfig = Test['context']['config'] & {
  browserName: BrowserType
  wsEndpoint: WsEndpointType
  device: DeviceType
}

export type JestPlaywrightContext = Omit<Test['context'], 'config'> & {
  config: JestPlaywrightProjectConfig
}

export type JestPlaywrightTest = Omit<Test, 'context'> & {
  context: JestPlaywrightContext
}

export interface BrowserTest {
  test: JestPlaywrightTest
  config: JestPlaywrightConfig
  browser: BrowserType
  wsEndpoint: WsEndpointType
  device: DeviceType
  testTimeout?: number
}

export type ConfigParams = {
  browserName: BrowserType
  deviceName: Nullable<string>
  browser: Nullable<Browser | BrowserContext>
  context: BrowserContext
  page: Page
}
