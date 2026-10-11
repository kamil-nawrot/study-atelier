import { svelte } from '@sveltejs/vite-plugin-svelte';
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
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['scripts/**/*.test.ts', 'src/**/*.test.ts']
	}
});
