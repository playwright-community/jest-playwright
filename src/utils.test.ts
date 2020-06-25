import fs from 'fs'
import path from 'path'
import * as Utils from './utils'
import { DEFAULT_CONFIG, CHROMIUM } from './constants'
import type { BrowserType } from './types'

const {
  readConfig,
  getBrowserType,
  getDeviceType,
  checkBrowserEnv,
  checkDeviceEnv,
  getPlaywrightInstance,
  getDisplayName,
} = Utils

jest.spyOn(fs, 'exists')

beforeEach(() => {
  jest.resetModules()
})

describe('readConfig', () => {
  it('should return the default configuration if there was no separate configuration specified', async () => {
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
        launchOptions: {
          headless: true,
        },
        browser: 'chromium',
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        ignoreHTTPSErrors: true,
      },
      browser: 'chromium',
      exitOnPageError: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })
  it('should overwrite with a custom configuration and spread the "launchOptions" and "contextOptions" setting', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchOptions: {
          headless: true,
        },
        contextOptions: {
          foo: true,
        },
      }),
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        foo: true,
      },
      browsers: ['chromium'],
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

describe('getDisplayName', () => {
  it('should return right display name for passed browser', () => {
    expect(getDisplayName('chromium', null)).toBe('browser: chromium')
  })

  it('should return right display name for passed browser and device', () => {
    expect(getDisplayName('chromium', 'iPhone 6')).toBe(
      'browser: chromium device: iPhone 6',
    )
  })

  it('should return right display name for passed browser and custom device', () => {
    const customDevice = {
      name: 'Custom device',
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    }
    expect(getDisplayName('chromium', customDevice)).toBe(
      'browser: chromium device: Custom device',
    )
  })
})

describe('getBrowserType', () => {
  it('should return "chromium" as default', async () => {
    const browserType = getBrowserType()
    expect(browserType).toBe(CHROMIUM)
  })
  it('should return BROWSER if defined', async () => {
    process.env.BROWSER = 'webkit'
    const browserType = getBrowserType('firefox')
    expect(browserType).toBe(process.env.BROWSER)
    delete process.env.BROWSER
  })
})

describe('getDeviceType', () => {
  it('should return "null" when there is no device', async () => {
    const device = getDeviceType(null)
    expect(device).toBe(null)
  })
  it('should return BROWSER if defined', async () => {
    process.env.DEVICE = 'iPhone 11'
    const device = getDeviceType(null)
    expect(device).toBe(process.env.DEVICE)
    delete process.env.DEVICE
  })
})

describe('checkBrowserEnv', () => {
  it('should throw Error with unknown type', async () => {
    const browserType = getBrowserType('unknown' as BrowserType)
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

describe('getPlaywrightInstance', () => {
  it('should return specified instance from playwright package', async () => {
    jest.doMock('playwright', () => ({
      firefox: 'firefox',
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance('firefox')
    expect(instance).toEqual('firefox')
  })

  it('should return specified instance from specified playwright package', () => {
    jest.doMock('playwright-chromium', () => ({
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance('chromium')
    expect(instance).toEqual('chromium')
  })

  it('should throw error when playwright package is not provided', () => {
    jest.doMock('playwright', () => ({
      chromium: 'chromium',
    }))

    const getMissedPlaywrightInstance = () => getPlaywrightInstance('firefox')

    expect(getMissedPlaywrightInstance).toThrowError(
      'jest-playwright-preset: Cannot find playwright package to use firefox',
    )
  })
})
