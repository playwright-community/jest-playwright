import { spawn, spawnSync, SpawnSyncOptions } from 'child_process'
import {
  checkBrowserEnv,
  getBrowserType,
  readConfig,
  readPackage,
} from '../utils'
import { checkCommand, getExitCode, getLogMessage } from './utils'
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
  // TODO Work only if we pass config through package.json
  const rootDir = process.env.npm_package_jest_rootDir
    ? `${process.cwd()}/${process.env.npm_package_jest_rootDir}/`
    : process.cwd()
  const config = await readConfig(rootDir)
  const { browsers = [], devices = [] } = config
  let exitCodes: (number | null)[] = []
  checkCommand(browsers, devices)
  if (!browsers.length && devices.length) {
    let browserType: BrowserType
    const browser = await readPackage()
    if (browser === PLAYWRIGHT || browser === CORE) {
      browserType = getBrowserType(config)
      checkBrowserEnv(browserType)
    } else {
      browserType = browser
    }
    exitCodes = await Promise.all(
      devices.map(device =>
        exec({ sequence, browser: browserType, device, params }),
      ),
    )
  }
  if (browsers.length) {
    if (devices.length) {
      const multipleCodes = await Promise.all(
        browsers.map(browser =>
          Promise.all(
            devices.map(device => exec({ sequence, browser, device, params })),
          ),
        ),
      )
      exitCodes = multipleCodes.reduce((acc, val) => acc.concat(val), [])
    } else {
      exitCodes = await Promise.all(
        browsers.map(browser => exec({ sequence, browser, params })),
      )
    }
  }
  getExitCode(exitCodes)
}

export default runner
