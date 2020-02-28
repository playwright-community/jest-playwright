import { spawn, spawnSync, SpawnSyncOptions } from 'child_process'
import { readConfig } from '../utils'
import { checkBrowsers, getResultByStatus } from './utils'
import { PARALLEL, BrowserType } from '../constants'

const getSpawnOptions = (browser: BrowserType): SpawnSyncOptions => ({
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BROWSER: browser,
  },
})

const exec = ({
  sequence,
  browser,
  params,
}: {
  sequence: string
  browser: BrowserType
  params: string[]
}): Promise<number | null> =>
  new Promise(resolve => {
    const options = getSpawnOptions(browser)
    if (sequence === PARALLEL) {
      const process = spawn(
        'node',
        [`node_modules/.bin/jest ${params}`],
        options,
      )
      process.on('close', status => {
        console.log(`${getResultByStatus(status)} tests for ${browser}\n\n`)
        resolve(status)
      })
    } else {
      const { status } = spawnSync(
        'node',
        [`node_modules/.bin/jest ${params}`],
        options,
      )
      console.log(`${getResultByStatus(status)} tests for ${browser}`)
      resolve(status)
    }
  })

const runner = async (sequence: string, params: string[]): Promise<void> => {
  const { browsers = [] } = await readConfig()
  checkBrowsers(browsers)
  const exitCodes = await Promise.all(
    browsers.map(browser => exec({ sequence, browser, params })),
  )
  if (exitCodes.every(code => code === 0)) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

export default runner
