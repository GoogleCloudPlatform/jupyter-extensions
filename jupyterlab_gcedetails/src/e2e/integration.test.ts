/**
 * @fileoverview E2E integration test
 */

const {
  JUPYTERLAB_URL = 'http://localhost:8080',
  INSTANCE,
  PROJECT,
} = process.env;

async function retry(testFunction: () => Promise<void>, attempts = 3) {
  do {
    try {
      await testFunction();
      return;
    } catch (err) {
      if (--attempts === 0) {
        throw err;
      }
    }
  } while (attempts > 0);
}

describe('GCE Details Extension', () => {
  beforeAll(async () => {
    await page.goto(JUPYTERLAB_URL);
  });

  it('Appears in statusbar', async () => {
    await expect(page).toMatch(`${INSTANCE} | ${PROJECT}`);
  });

  it('Opens dialog when icon is clicked', async () => {
    await retry(async () => {
      await expect(page).toClick('span.jp-VmStatusIcon');
      await expect(page).toMatch('Notebook VM Details', { timeout: 500 });
      await expect(page).toClick('button', { text: 'OK' });
    });
  });
});
