import { defineConfig, devices } from '@playwright/test';
import { localSupabase } from './e2e/local-supabase.ts';

const PORT = 5290;
const supabase = localSupabase();

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		locale: 'pl-PL',
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `vite dev --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		timeout: 120_000,
		env: {
			SUPABASE_URL: supabase.url,
			SUPABASE_PUBLISHABLE_KEY: supabase.publishableKey
		}
	}
});
