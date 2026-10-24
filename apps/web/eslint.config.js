import path from 'node:path';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import base from '../../eslint.config.base.js';
import { allowlisted } from '../../lint/limits.js';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	{ ignores: ['worker-configuration.d.ts', 'src/lib/shared/data/database.types.ts'] },
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
	...allowlisted('supabase', { 'no-restricted-imports': 'off' }),
	{
		files: ['src/**/*.ts', 'src/**/*.svelte'],
		rules: {
			'study-atelier/import-paths': 'error',
			'study-atelier/no-wiki-hosts': 'error',
			'no-restricted-globals': [
				'error',
				...['localStorage', 'sessionStorage'].map((name) => ({
					name,
					message: 'Use readStored and writeStored from #lib/shared/utils/storage/storage.ts'
				}))
			]
		}
	},
	{
		files: [
			'src/lib/images/**',
			'src/lib/glossary/**/wikipedia*.ts',
			'src/lib/glossary/**/wiktionary*.ts',
			'**/*.spec.ts',
			'**/testing/**'
		],
		rules: { 'study-atelier/no-wiki-hosts': 'off' }
	},
	{
		files: ['src/lib/shared/utils/storage/**', '**/*.spec.ts', '**/testing/**'],
		rules: { 'no-restricted-globals': 'off' }
	},
	...allowlisted('storage', { 'no-restricted-globals': 'off' })
);
