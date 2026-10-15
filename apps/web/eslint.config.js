import path from 'node:path';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import base from '../../eslint.config.base.js';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	{ ignores: ['worker-configuration.d.ts', 'src/lib/database.types.ts'] },
	base
);
