module.exports = {
  preset: 'ts-jest',
  testEnvironment: './lib/PlaywrightEnvironment.js',
  testPathIgnorePatterns: ['/node_modules/', 'lib'],
}
