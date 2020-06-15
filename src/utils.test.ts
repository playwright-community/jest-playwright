import fs from 'fs'
import path from 'path'
import * as Utils from './utils'
import { DEFAULT_CONFIG, CHROMIUM, WEBKIT, FIREFOX } from './constants'
import type { BrowserType } from './types'

const {
  readConfig,
  getBrowserType,
  getDeviceType,
  checkBrowserEnv,
  checkDeviceEnv,
  checkDependencies,
  readPackage,
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
  it('should return "undefined" when there is no device', async () => {
    const device = getDeviceType()
    expect(device).toBe(undefined)
  })
  it('should return BROWSER if defined', async () => {
    process.env.DEVICE = 'iPhone 11'
    const device = getDeviceType()
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

describe('checkDependencies', () => {
  it('should return null for empty dependencies', () => {
    const dep = checkDependencies({})
    expect(dep).toBe(null)
  })

  it('should return null for dependencies without playwright packages', () => {
    const dep = checkDependencies({ test: '0.0.1' })
    expect(dep).toBe(null)
  })

  it('should return right package object for single package', () => {
    const dep = checkDependencies({ 'playwright-chromium': '*' })
    expect(dep).toStrictEqual({ [CHROMIUM]: CHROMIUM })
  })

  it('should return right package object for multiple packages', () => {
    const dep = checkDependencies({
      'playwright-webkit': '*',
      'playwright-chromium': '*',
    })
    expect(dep).toStrictEqual({ [WEBKIT]: WEBKIT, [CHROMIUM]: CHROMIUM })
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

    await expect(readPackage()).rejects.toThrowError(
      'None of playwright packages was not found in dependencies',
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
    expect(playwright).toStrictEqual({ [FIREFOX]: FIREFOX })
  })
  it('should return playwright-firefox when it is defined and empty dependencies are persistent', async () => {
    ;((fs.exists as unknown) as jest.Mock).mockImplementationOnce(
      (_, cb: (exists: boolean) => void) => cb(true),
    )
    jest.mock(
      path.join(__dirname, '..', 'package.json'),
      () => ({
        dependencies: {},
        devDependencies: {
          'playwright-firefox': '*',
        },
      }),
      { virtual: true },
    )

    const playwright = await readPackage()
    expect(playwright).toStrictEqual({ [FIREFOX]: FIREFOX })
  })
})

describe('getPlaywrightInstance', () => {
  const spy = jest.spyOn(Utils, 'readPackage')

  it('should return specified instance from playwright package', async () => {
    spy.mockResolvedValue('playwright')

    jest.doMock('playwright', () => ({
      firefox: 'firefox',
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance('playwright', 'firefox')
    expect(instance).toEqual('firefox')
  })

  it('should return specified instance from specified playwright package', () => {
    spy.mockResolvedValue({
      chromium: 'chromium',
    })

    jest.doMock('playwright-chromium', () => ({
      chromium: 'chromium',
    }))

    const { instance } = getPlaywrightInstance(
      { chromium: 'chromium' },
      'chromium',
    )
    expect(instance).toEqual('chromium')
  })

  it('should throw error when playwright package is not provided', () => {
    spy.mockResolvedValue({
      chromium: 'chromium',
    })

    jest.doMock('playwright-chromium', () => ({
      chromium: 'chromium',
    }))

    const getMissedPlaywrightInstance = () =>
      getPlaywrightInstance({ chromium: 'chromium' }, 'firefox')

    expect(getMissedPlaywrightInstance).toThrowError(
      'Cannot find provided playwright package',
    )
  })
})
