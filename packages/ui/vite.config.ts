import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	optimizeDeps: {
		include: [
			'@lucide/svelte/icons/bold',
			'@lucide/svelte/icons/heading',
			'@lucide/svelte/icons/italic',
			'@lucide/svelte/icons/list',
			'@lucide/svelte/icons/list-ordered',
			'@tiptap/core',
			'@tiptap/markdown',
			'@tiptap/starter-kit',
			'dompurify',
			'marked'
		]
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'node',
					environment: 'node',
					include: ['scripts/**/*.test.ts', 'src/**/*.test.ts']
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
					include: ['src/**/*.svelte.spec.ts']
				}
			}
		]
	}
});
