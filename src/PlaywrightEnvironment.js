import fs from 'fs'
import NodeEnvironment from 'jest-environment-node'
import playwright from 'playwright'
import { WS_ENDPOINT_PATH } from './constants'
import { checkBrowserEnv, getBrowserType, readConfig } from './utils'

const handleError = error => {
  process.emit('uncaughtException', error)
}

class PlaywrightEnvironment extends NodeEnvironment {
  async setup() {
    const wsEndpoint = fs.readFileSync(WS_ENDPOINT_PATH, 'utf8')
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }
    const config = await readConfig()
    const browserType = getBrowserType(config)
    checkBrowserEnv(browserType)
    const { connect, context } = config
    const connectOptions = { browserWSEndpoint: wsEndpoint, ...connect }
    this.global.browser = await playwright[browserType].connect(connectOptions)
    this.global.context = await this.global.browser.newContext(context)
    this.global.page = await this.global.context.newPage()
    this.global.page.on('pageerror', handleError)
  }

  async teardown() {
    await super.teardown()
    this.global.page.removeListener('pageerror', handleError)
    await this.global.page.close()
  }
}

export default PlaywrightEnvironment
