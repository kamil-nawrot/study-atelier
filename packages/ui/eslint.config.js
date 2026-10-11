import path from 'node:path';
import storybook from 'eslint-plugin-storybook';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import base from '../../eslint.config.base.js';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	{ ignores: ['!.storybook'] },
	base,
	storybook.configs['flat/recommended']
);
