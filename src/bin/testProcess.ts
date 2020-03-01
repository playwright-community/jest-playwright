import { spawn, spawnSync, SpawnSyncOptions } from 'child_process'
import {
  checkBrowserEnv,
  getBrowserType,
  readConfig,
  readPackage,
} from '../utils'
import { checkCommand, getLogMessage } from './utils'
import { BrowserType, CORE, PARALLEL, PLAYWRIGHT } from '../constants'

const getSpawnOptions = (
  browser: BrowserType,
  device: string | null,
): SpawnSyncOptions => ({
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BROWSER: browser,
    ...(device ? { DEVICE: device } : {}),
  },
})

const exec = ({
  sequence,
  browser,
  device = null,
  params,
}: {
  sequence: string
  browser: BrowserType
  device?: string | null
  params: string[]
}): Promise<number | null> =>
  new Promise(resolve => {
    const options = getSpawnOptions(browser, device)
    if (sequence === PARALLEL) {
      const process = spawn(
        'node',
        [`node_modules/jest/bin/jest.js ${params}`],
        options,
      )
      process.on('close', status => {
        console.log(getLogMessage(browser, status, device))
        resolve(status)
      })
    } else {
      const { status } = spawnSync(
        'node',
        [`node_modules/jest/bin/jest.js ${params}`],
        options,
      )
      console.log(getLogMessage(browser, status, device))
      resolve(status)
    }
  })

const runner = async (sequence: string, params: string[]): Promise<void> => {
  const { browsers = [], devices = [] } = await readConfig()
  checkCommand(browsers, devices)
  if (!browsers.length && devices.length) {
    let browserType: BrowserType
    const browser = await readPackage()
    if (browser === PLAYWRIGHT || browser === CORE) {
      const config = await readConfig()
      browserType = getBrowserType(config)
      checkBrowserEnv(browserType)
    } else {
      browserType = browser
    }
    devices.forEach(device =>
      exec({ sequence, browser: browserType, device, params }),
    )
  }
  if (browsers.length) {
    if (devices.length) {
      browsers.forEach(browser =>
        devices.forEach(device => exec({ sequence, browser, device, params })),
      )
    } else {
      browsers.forEach(browser => exec({ sequence, browser, params }))
    }
  }
}

export default runner
