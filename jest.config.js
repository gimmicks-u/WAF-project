/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['<rootDir>/test/**/*.spec.js'],
  testTimeout: 15000,
  // Ensure only our tests in test/ are picked up
  roots: ['<rootDir>/test'],
};
