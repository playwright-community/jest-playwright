import { spawn, spawnSync, SpawnSyncOptions } from 'child_process'
import { readConfig } from '../utils'
import { checkBrowsers } from './utils'
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
}) => {
  // TODO Add messages for browser process
  const options = getSpawnOptions(browser)
  if (sequence === PARALLEL) {
    spawn('node', [`node_modules/.bin/jest ${params}`], options)
  } else {
    spawnSync('node', [`node_modules/.bin/jest ${params}`], options)
  }
}

const runner = async (sequence: string, params: string[]) => {
  const { browsers = [] } = await readConfig()
  checkBrowsers(browsers)
  browsers.forEach(browser => exec({ sequence, browser, params }))
}

export default runner
