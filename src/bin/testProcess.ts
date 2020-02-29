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
}): void => {
  const options = getSpawnOptions(browser)
  if (sequence === PARALLEL) {
    const process = spawn(
      'node',
      [`node_modules/jest/bin/jest.js ${params}`],
      options,
    )
    process.on('close', status => {
      console.log(`${getResultByStatus(status)} tests for ${browser}\n\n`)
    })
  } else {
    const { status } = spawnSync(
      'node',
      [`node_modules/jest/bin/jest.js ${params}`],
      options,
    )
    console.log(`${getResultByStatus(status)} tests for ${browser}`)
  }
}

const runner = async (sequence: string, params: string[]): Promise<void> => {
  const { browsers = [] } = await readConfig()
  checkBrowsers(browsers)
  browsers.forEach(browser => exec({ sequence, browser, params }))
}

export default runner
