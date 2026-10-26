import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const release = `study-atelier@${version}`;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
	define: { __APP_RELEASE__: JSON.stringify(release) },
	build: { sourcemap: sentryAuthToken ? 'hidden' : false },
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ platformProxy: { persist: false } })
		}),
		sentryAuthToken
			? sentryVitePlugin({
					org: process.env.SENTRY_ORG,
					project: process.env.SENTRY_PROJECT,
					authToken: sentryAuthToken,
					release: { name: release, inject: false },
					sourcemaps: { filesToDeleteAfterUpload: ['.svelte-kit/output/**/*.map'] },
					telemetry: false
				})
			: []
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			exclude: ['src/**/*.{test,spec}.ts', 'src/lib/shared/data/database.types.ts'],
			reporter: ['text-summary', 'json-summary', 'html'],
			thresholds: { statements: 94, branches: 86, functions: 95, lines: 95 }
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['src/lib/testing/ui-messages/ui-messages.ts', 'src/lib/testing/env/env.ts']
				}
			}
		]
	}
});
