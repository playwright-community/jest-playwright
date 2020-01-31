import { CHROMIUM, FIREFOX, WEBKIT } from './constants';

function checkBrowserEnv(param) {
    if (param !== CHROMIUM && param !== FIREFOX && param !== WEBKIT) {
        throw new Error(`Wrong browser type. Should be one of [${CHROMIUM}, ${FIREFOX}, ${WEBKIT}], but got ${param}`)
    }
}

export default checkBrowserEnv
