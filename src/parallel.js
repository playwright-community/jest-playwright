import { spawn } from 'child_process'

const exec = (browser = 'chromium') => {
  spawn('node', ['node_modules/.bin/jest'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      BROWSER: browser,
    },
  })
}

exec()
exec('firefox')
exec('webkit')
