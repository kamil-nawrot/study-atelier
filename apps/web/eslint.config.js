import path from 'node:path';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import base from '../../eslint.config.base.js';
import { allowlisted } from '../../lint/limits.js';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	{ ignores: ['worker-configuration.d.ts', 'src/lib/database.types.ts'] },
	base,
	{
		files: ['**/*.ts', '**/*.svelte'],
		ignores: ['**/*-data.ts', '**/*.spec.ts', '**/testing/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '(^|/)supabase\\.ts$',
							message: 'Only *-data.ts files import the Supabase client (ADR-0126).'
						}
					]
				}
			]
		}
	},
	...allowlisted('supabase', { 'no-restricted-imports': 'off' })
);
