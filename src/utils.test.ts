import fs from 'fs'
import path from 'path'
import * as Utils from './utils'
import { DEFAULT_CONFIG, CHROMIUM, FIREFOX } from './constants'
import type { BrowserType, JestPlaywrightConfig } from '../types/global'

const {
  readConfig,
  getBrowserType,
  getDeviceType,
  checkBrowserEnv,
  checkDeviceEnv,
  getPlaywrightInstance,
  getDisplayName,
  getSkipFlag,
  getBrowserOptions,
} = Utils

beforeEach(() => {
  jest.resetModules()
})

describe('readConfig', () => {
  it('should return the default configuration if there was no separate configuration specified', async () => {
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({}),
      { virtual: true },
    )
    const config = await readConfig()
    expect(config).toMatchObject(DEFAULT_CONFIG)
  })
  it('should overwrite with a custom configuration', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      browsers: ['chromium'],
      contextOptions: {
        viewport: {
          width: 800,
          height: 640,
        },
        ignoreHTTPSErrors: true,
      },
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => configObject,
      { virtual: true },
    )
    const config = await readConfig()
    expect(config).toMatchObject(configObject)
  })
  it('should overwrite config if the second param is passed', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      browsers: ['chromium'],
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => ({
        launchOptions: {
          headless: true,
        },
        browsers: ['webkit'],
      }),
      { virtual: true },
    )
    const config = await readConfig(
      process.cwd(),
      configObject as JestPlaywrightConfig,
    )
    expect(config).toMatchObject(configObject)
  })
  it('should overwrite with a custom configuration and spread the "launchOptions" and "contextOptions" setting', async () => {
    const configObject = {
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        foo: true,
      },
    }
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.js'),
      () => configObject,
      { virtual: true },
    )
    const config = await readConfig()
    const expectedConfig = {
      ...configObject,
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
  it('should check cjs config if npm_package_type is module', async () => {
    process.env.npm_package_type = 'module'
    const configPath = path.join(__dirname, '..', 'jest-playwright.config.cjs')
    const configObject = {
      browsers: ['webkit'],
      launchOptions: {
        headless: true,
      },
      contextOptions: {
        foo: true,
      },
    }
    fs.writeFileSync(configPath, '')
    jest.mock(
      path.join(__dirname, '..', 'jest-playwright.config.cjs'),
      () => configObject,
      {
        virtual: true,
      },
    )
    const expectedConfig = {
      ...configObject,
      exitOnPageError: true,
    }
    const config = await readConfig()
    expect(config).toMatchObject(expectedConfig)
    delete process.env.npm_package_type
    fs.unlinkSync(configPath)
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

describe('getBrowserOptions', () => {
  it('should return undefined for empty options', async () => {
    const options = getBrowserOptions(CHROMIUM)
    expect(options).toBe(undefined)
  })

  it('should return root options', async () => {
    const launchOptions = { headless: false }
    const options = getBrowserOptions(CHROMIUM, launchOptions)
    expect(options).toBe(launchOptions)
  })

  it('should return options for defined browser', async () => {
    const launchOptions = { headless: false, chromium: { headless: true } }
    const options = getBrowserOptions(CHROMIUM, launchOptions)
    expect(options).toStrictEqual({ headless: true })
  })

  it('should return root options for other browser', async () => {
    const launchOptions = { headless: false, chromium: { headless: true } }
    const options = getBrowserOptions(FIREFOX, launchOptions)
    expect(options).toStrictEqual({ headless: false })
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

describe('getSkipFlag', () => {
  it('should return true if skipOption.browsers includes browserName', async () => {
    const skipOptions = { browsers: [CHROMIUM as BrowserType] }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, null)
    expect(skipFlag).toBe(true)
  })

  it('should return false if skipOption.browsers does not include browserName', async () => {
    const skipOptions = { browsers: [CHROMIUM as BrowserType] }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, null)
    expect(skipFlag).toBe(false)
  })

  it('should return true if skipOption.browser includes browserName & skipOption.devices includes deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: /Pixel/,
    }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, 'Pixel 2')
    expect(skipFlag).toBe(true)
  })

  it('should return true if skipOption.devices is RegExp and match to deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, CHROMIUM, 'Pixel 2')
    expect(skipFlag).toBe(true)
  })

  it('should return false if skipOption.browser does not include browserName & skipOption.devices includes deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, 'Pixel 2')
    expect(skipFlag).toBe(false)
  })

  it('should return false if skipOption.browser does not includes browserName & skipOption.devices does not include deviceName', async () => {
    const skipOptions = {
      browsers: [CHROMIUM as BrowserType],
      devices: ['Pixel 2'],
    }
    const skipFlag = getSkipFlag(skipOptions, FIREFOX, null)
    expect(skipFlag).toBe(false)
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
