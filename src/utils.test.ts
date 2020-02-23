import fs from 'fs'
import path from 'path'
import {
  readConfig,
  getBrowserType,
  getDeviceType,
  checkBrowserEnv,
  checkDeviceEnv,
  readPackage,
} from './utils'
import { DEFAULT_CONFIG, CHROMIUM } from './constants'

jest.spyOn(fs, 'exists')

beforeEach(() => {
  jest.resetModules()
})

describe('readConfig', () => {
  it('should return the default configuration if there was no seperate configuration specified', async () => {
    const config = await readConfig()
    expect(config).toMatchObject(DEFAULT_CONFIG)
  })
  it('should overwrite with a custom configuration', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchBrowserApp: {
          headless: true,
        },
        browser: 'chromium',
        context: {
          ignoreHTTPSErrors: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchBrowserApp: {
        headless: true,
      },
      context: {
        ignoreHTTPSErrors: true,
      },
      browser: 'chromium',
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
  it('should overwrite with a custom configuration and spread the "launchBrowserApp" and "context" setting', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchBrowserApp: {
          headless: true,
        },
        context: {
          foo: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchBrowserApp: {
        headless: true,
      },
      context: {
        foo: true,
      },
      browser: 'chromium',
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
  it('should throw error if JEST_PLAYWRIGHT_CONFIG is defined but does not exist', async () => {
    process.env.JEST_PLAYWRIGHT_CONFIG = 'unreached.js'
    let error
    try {
      await readConfig()
    } catch (e) {
      error = e
    }
    expect(error).toBeTruthy()
    delete process.env.JEST_PLAYWRIGHT_CONFIG
  })
})

describe('getBrowserType', () => {
  it('should return "chromium" as default', async () => {
    const config = await readConfig()
    const browserType = getBrowserType(config)
    expect(browserType).toBe(CHROMIUM)
  })
  it('should return BROWSER if defined', async () => {
    process.env.BROWSER = 'webkit'
    const browserType = getBrowserType({ exitOnPageError: false })
    expect(browserType).toBe(process.env.BROWSER)
    delete process.env.BROWSER
  })
})

describe('getDeviceType', () => {
  it('should return "undefined" when there is no device', async () => {
    const config = await readConfig()
    const device = getDeviceType(config)
    expect(device).toBe(undefined)
  })
  it('should return BROWSER if defined', async () => {
    process.env.DEVICE = 'iPhone 11'
    const device = getDeviceType({ exitOnPageError: false })
    expect(device).toBe(process.env.DEVICE)
    delete process.env.DEVICE
  })
})

describe('checkBrowserEnv', () => {
  it('should throw Error with unknown type', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        browser: 'unknown',
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const browserType = getBrowserType(config)
    expect(() => checkBrowserEnv(browserType)).toThrow()
  })
})

describe('checkDeviceEnv', () => {
  it('should throw Error with unknown type', async () => {
    const device = 'unknown'
    const devices = ['iPhone 11', 'Pixel 2', 'Nexus 4']
    expect(() => checkDeviceEnv(device, devices)).toThrow()
  })
})

describe('readPackage', () => {
  it('should return null when dependencies does not passed', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        dependencies: {},
      }),
      { virtual: true },
    )
    let error
    try {
      await readPackage()
    } catch (e) {
      error = e
    }
    expect(error).toEqual(
      new Error('None of playwright packages was not found in dependencies'),
    )
  })
  it('should return playwright when it is defined', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        dependencies: {
          playwright: '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toEqual('playwright')
  })
  it('should return playwright-firefox when it is defined', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        devDependencies: {
          'playwright-firefox': '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toEqual('firefox')
  })
  it('should return playwright-core when it is defined', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        devDependencies: {
          'playwright-core': '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toEqual('core')
  })
})
