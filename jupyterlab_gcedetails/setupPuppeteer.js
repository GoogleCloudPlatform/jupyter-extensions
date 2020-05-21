/**
 * @fileoverview Sets up default timeout for Puppeteer tests.
 */
const { setDefaultOptions } = require('expect-puppeteer');
setDefaultOptions({ timeout: 30000 });
