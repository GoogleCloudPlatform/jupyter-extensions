module.exports = {
  preset: 'jest-puppeteer',
  launch: {
    headless: false,
  },
  setupFilesAfterEnv: ['./setupPuppeteer.js'],
  testMatch: ['<rootDir>/src/e2e/**/*'],
  testTimeout: 60000,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
