import path from 'path'
import os from 'os'

export const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup');
export const WS_ENDPOINT_PATH = path.join(DIR, 'wsEndpoint');

export const CHROMIUM = 'chromium';
export const FIREFOX = 'firefox';
export const WEBKIT = 'webkit';
