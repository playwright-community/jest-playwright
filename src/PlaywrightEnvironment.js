import fs from 'fs'
import NodeEnvironment from 'jest-environment-node'
import playwright from 'playwright'
import { WS_ENDPOINT_PATH } from './constants'

const handleError = error => {
  process.emit('uncaughtException', error)
};

class PlaywrightEnvironment extends NodeEnvironment {
  async teardown() {
    console.log('Teardown Test Environment.');
    await super.teardown()
  }

  async setup() {
    const wsEndpoint = fs.readFileSync(WS_ENDPOINT_PATH, 'utf8');
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }
    const browserType = process.env.BROWSER;
    this.global.browser = await playwright[browserType].connect({
      browserWSEndpoint: wsEndpoint,
    });
    this.global.context = await this.global.browser.newContext();
    this.global.page = await this.global.context.newPage();
    this.global.page.on('pageerror', handleError)
  }

  async teardown() {
    this.global.page.removeListener('pageerror', handleError);
    await this.global.page.close()
  }
}

export default PlaywrightEnvironment
