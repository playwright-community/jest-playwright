module.exports = {
  preset: 'ts-jest',
  testEnvironment: './lib/PlaywrightEnvironment.js',
  runner: './runner.js',
  testSequencer: './testSequencer.js',
  testPathIgnorePatterns: ['/node_modules/', 'lib'],
  testMatch: ['**/e2e/**/*.test.ts'],
}
