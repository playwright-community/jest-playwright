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
    const { connect, context, device } = config
    const connectOptions = { browserWSEndpoint: wsEndpoint, ...connect }
    let contextOptions = context
    this.global.browser = await playwright[browserType].connect(connectOptions)
    const availableDevices = Object.keys(playwright.devices)
    if (device) {
      if (!availableDevices.includes(device)) {
        throw new Error(
          `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
        )
      } else {
        const { viewport, userAgent } = playwright.devices[device]
        contextOptions = { ...contextOptions, viewport, userAgent }
      }
    }
    this.global.context = await this.global.browser.newContext(contextOptions)
    this.global.page = await this.global.context.newPage()
    this.global.page.on('pageerror', handleError)
  }

  async teardown() {
    await super.teardown()
    if (this.global.page) {
      this.global.page.removeListener('pageerror', handleError)
      await this.global.page.close()
    }
  }
}

export default PlaywrightEnvironment
