module.exports = {
  preset: 'jest-puppeteer',
  launch: {
    headless: false,
  },
  testMatch: ['<rootDir>/src/test/*'],
  testTimeout: 60000,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  server: {
    command: 'jupyter lab',
    port: 8888,
  },
};
