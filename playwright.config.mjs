// Playwright runs only the e2e specs; they need a live `salla theme preview` URL (see each spec).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.mjs$/,
  timeout: 60_000,
  reporter: [['list']],
  use: { reducedMotion: 'reduce' },
});
