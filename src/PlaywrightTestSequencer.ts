import JestSequencer from '@jest/test-sequencer'
import type { Test } from 'jest-runner'
import type { BrowserType } from '../types/global'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getBrowserOptions,
  getDisplayName,
  getPlaywrightInstance,
  readConfig,
} from './utils'
import {
  CustomDeviceType,
  DeviceType,
  JestPlaywrightConfig,
  JestPlaywrightTest,
  WsEndpointType,
} from '../types/global'
import { CONFIG_ENVIRONMENT_NAME, SERVER } from './constants'
import { BrowserServer } from 'playwright-core'

const getBrowserTest = (
  test: JestPlaywrightTest,
  config: JestPlaywrightConfig,
  browser: BrowserType,
  wsEndpoint: WsEndpointType,
  device: DeviceType,
): JestPlaywrightTest => {
  const { displayName, testEnvironmentOptions } = test.context.config
  const playwrightDisplayName = getDisplayName(browser, device)
  return {
    ...test,
    context: {
      ...test.context,
      config: {
        ...test.context.config,
        testEnvironmentOptions: {
          ...testEnvironmentOptions,
          [CONFIG_ENVIRONMENT_NAME]: config,
        },
        browserName: browser,
        wsEndpoint,
        device,
        displayName: {
          name: displayName
            ? `${playwrightDisplayName} ${
                typeof displayName === 'string' ? displayName : displayName.name
              }`
            : playwrightDisplayName,
          color: 'yellow',
        },
      },
    },
  }
}

class CustomSequencer extends JestSequencer {
  browser2Server: Partial<Record<BrowserType, BrowserServer>>
  constructor() {
    super()
    this.browser2Server = {}
  }

  async getTests(tests: Test[], config: JestPlaywrightConfig): Promise<Test[]> {
    const { browsers, devices, launchType, launchOptions } = config
    let resultDevices: (string | CustomDeviceType)[] = []
    const pwTests: Test[] = []
    for (const test of tests) {
      for (const browser of browsers) {
        checkBrowserEnv(browser)
        const { devices: availableDevices, instance } = getPlaywrightInstance(
          browser,
        )
        let wsEndpoint: WsEndpointType = null
        if (launchType === SERVER) {
          if (!this.browser2Server[browser]) {
            const options = getBrowserOptions(browser, launchOptions)
            this.browser2Server[browser] = await instance.launchServer(options)
          }
          wsEndpoint = this.browser2Server[browser]!.wsEndpoint()
        }

        if (devices instanceof RegExp) {
          resultDevices = Object.keys(availableDevices).filter((item) =>
            item.match(devices),
          )
        } else {
          if (devices) {
            resultDevices = devices
          }
        }

        if (resultDevices.length) {
          resultDevices.forEach((device: DeviceType) => {
            if (typeof device === 'string') {
              const availableDeviceNames = Object.keys(availableDevices)
              checkDeviceEnv(device, availableDeviceNames)
            }
            pwTests.push(
              getBrowserTest(
                test as JestPlaywrightTest,
                config,
                browser,
                wsEndpoint,
                device,
              ),
            )
          })
        } else {
          pwTests.push(
            getBrowserTest(
              test as JestPlaywrightTest,
              config,
              browser,
              wsEndpoint,
              null,
            ),
          )
        }
      }
    }

    return pwTests
  }
  //@ts-ignore
  async sort(tests: Test[]): Promise<Test[]> {
    if (process.env.JEST_PLAYWRIGHT_EXPERIMENTAL) {
      const copyTests = Array.from(tests)
      const { rootDir, testEnvironmentOptions } = tests[0].context.config
      const config = await readConfig(
        rootDir,
        testEnvironmentOptions[CONFIG_ENVIRONMENT_NAME],
      )
      return this.getTests(copyTests, config)
    }

    return tests
  }
}

export default CustomSequencer
