const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: ['__tests__/**/*.js', '__tests__/**/*.mjs'],
    timeout: 600000, // 10 minutes in ms
    environment: 'node',
  },
});
