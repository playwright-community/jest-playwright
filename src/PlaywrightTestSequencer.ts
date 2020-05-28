import JestSequencer from '@jest/test-sequencer'
import type { Test } from 'jest-runner'
import type { BrowserType } from './types'
import {
  checkBrowserEnv,
  checkDeviceEnv,
  getPlaywrightInstance,
  readConfig,
  readPackage,
} from './utils'

const getBrowserTest = (
  test: Test,
  browser: BrowserType,
  device?: string,
): Test => {
  //@ts-ignore
  return { ...test, browser, device }
}

const getTests = async (tests: Test[]): Promise<Test[]> => {
  const playwrightPackage = await readPackage()
  const pwTests: Test[] = []
  await Promise.all(
    tests.map(async (test) => {
      const { rootDir } = test.context.config
      const { browsers, devices } = await readConfig(rootDir)
      browsers.forEach((browser) => {
        checkBrowserEnv(browser)
        const { devices: availableDevices } = getPlaywrightInstance(
          playwrightPackage,
          browser,
        )
        if (devices && devices.length) {
          devices.forEach((device) => {
            const availableDeviceNames = Object.keys(availableDevices)
            checkDeviceEnv(device, availableDeviceNames)
            pwTests.push(getBrowserTest(test, browser, device))
          })
        } else {
          pwTests.push(getBrowserTest(test, browser))
        }
      })
    }),
  )
  return pwTests
}

class CustomSequencer extends JestSequencer {
  //@ts-ignore
  async sort(tests: Test[]): Promise<Test[]> {
    const copyTests = Array.from(tests)
    return await getTests(copyTests)
  }
}

export default CustomSequencer
