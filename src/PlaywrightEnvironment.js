import NodeEnvironment from 'jest-environment-node'
import {
  checkBrowserEnv,
  getBrowserType,
  getPlaywrightInstance,
  readConfig,
} from './utils'

const handleError = error => {
  process.emit('uncaughtException', error)
}

let browserPerProcess = null
let browserShutdownTimeout = 0

function resetBrowserCloseWatchdog() {
  if (browserShutdownTimeout) clearTimeout(browserShutdownTimeout)
}

// Since there are no per-worker hooks, we have to setup a timer to
// close the browser.
//
// @see https://github.com/facebook/jest/issues/8708 (and upvote plz!)
function startBrowserCloseWatchdog() {
  resetBrowserCloseWatchdog()
  browserShutdownTimeout = setTimeout(async () => {
    const browser = browserPerProcess
    browserPerProcess = null
    if (browser) await browser.close()
  }, 50)
}

async function getBrowserPerProcess() {
  if (!browserPerProcess) {
    const config = await readConfig()
    const browserType = getBrowserType(config)
    checkBrowserEnv(browserType)
    const { launchBrowserApp, useStandaloneVersion } = config
    const playwrightInstance = getPlaywrightInstance(
      browserType,
      useStandaloneVersion,
    )
    browserPerProcess = await playwrightInstance.launch(launchBrowserApp)
  }
  return browserPerProcess
}

class PlaywrightEnvironment extends NodeEnvironment {
  async setup() {
    resetBrowserCloseWatchdog()
    const config = await readConfig()
    const browserType = getBrowserType(config)
    checkBrowserEnv(browserType)
    const { device, context, useStandaloneVersion } = config
    const playwrightInstance = getPlaywrightInstance(
      browserType,
      useStandaloneVersion,
    )
    let contextOptions = context

    const availableDevices = Object.keys(playwrightInstance.devices)
    if (device) {
      if (!availableDevices.includes(device)) {
        throw new Error(
          `Wrong device. Should be one of [${availableDevices}], but got ${device}`,
        )
      } else {
        const { viewport, userAgent } = playwrightInstance.devices[device]
        contextOptions = { ...contextOptions, viewport, userAgent }
      }
    }
    this.global.browser = await getBrowserPerProcess()
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
    startBrowserCloseWatchdog()
  }
}

export default PlaywrightEnvironment
