import JestSequencer from '@jest/test-sequencer'
import type { Test } from 'jest-runner'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  deepMerge,
  getBrowserTest,
  getPlaywrightInstance,
  readConfig,
} from './utils'
import {
  CustomDeviceType,
  DeviceType,
  JestPlaywrightConfig,
  JestPlaywrightTest,
} from '../types/global'
import { CONFIG_ENVIRONMENT_NAME, LAUNCH } from './constants'

class CustomSequencer extends JestSequencer {
  async getTests(tests: Test[], config: JestPlaywrightConfig): Promise<Test[]> {
    const { browsers, devices } = config
    const updatedConfig = { launchType: LAUNCH } as JestPlaywrightConfig
    let resultDevices: (string | CustomDeviceType)[] = []
    const pwTests: Test[] = []
    for (const test of tests) {
      for (const browser of browsers) {
        checkBrowserEnv(browser)
        const { devices: availableDevices } = getPlaywrightInstance(browser)
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
                deepMerge<JestPlaywrightConfig>(config, updatedConfig),
                browser,
                null,
                device,
              ),
            )
          })
        } else {
          pwTests.push(
            getBrowserTest(
              test as JestPlaywrightTest,
              deepMerge<JestPlaywrightConfig>(config, updatedConfig),
              browser,
              null,
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
