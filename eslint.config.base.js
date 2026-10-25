import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import studyAtelier from './lint/eslint-plugin.js';
import {
	allowlisted,
	exemptFromLines,
	limits,
	noEnums,
	noGotoInOnclick,
	noKeyboardTyping,
	noRealTimeWait,
	testFiles
} from './lint/limits.js';

function maxLines(max) {
	return ['error', { max, skipBlankLines: true }];
}

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.ts', '**/*.svelte'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{ allowExpressions: true, allowTypedFunctionExpressions: true }
			]
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			'svelte/sort-attributes': 'error'
		}
	},
	{
		plugins: { 'study-atelier': studyAtelier },
		rules: {
			'study-atelier/no-comments': 'error',
			'no-restricted-syntax': ['error', noEnums]
		}
	},
	{
		files: ['**/*.svelte'],
		rules: { 'no-restricted-syntax': ['error', noEnums, noGotoInOnclick] }
	},
	{
		files: testFiles,
		rules: {
			'no-restricted-syntax': ['error', noEnums, noRealTimeWait],
			'no-restricted-properties': ['error', noKeyboardTyping]
		}
	},
	{
		files: ['**/NotesEditor/*.spec.ts'],
		rules: { 'no-restricted-properties': 'off' }
	},
	...allowlisted('test-keyboard', { 'no-restricted-properties': 'off' }),
	...allowlisted('test-waiting', { 'no-restricted-syntax': ['error', noEnums] }),
	{
		files: ['**/*.ts', '**/*.svelte'],
		rules: {
			complexity: ['error', limits.complexity],
			'max-lines': maxLines(limits.ts)
		}
	},
	{
		files: ['**/*.svelte'],
		rules: { 'max-lines': maxLines(limits.svelte) }
	},
	{
		files: testFiles,
		rules: { 'max-lines': maxLines(limits.test) }
	},
	{
		files: exemptFromLines,
		rules: { 'max-lines': 'off' }
	},
	...allowlisted('lines', { 'max-lines': 'off' }),
	...allowlisted('complexity', { complexity: 'off' }),
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	}
];
