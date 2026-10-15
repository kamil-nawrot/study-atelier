import { afterEach, describe, expect, it } from 'vitest';
import { currentTheme, rememberedTheme, setTheme, themeScript } from './theme.svelte.ts';

function runThemeScript(): void {
	const source = themeScript.replace(/^<script>|<\/script>$/g, '');
	new Function(source)();
}

describe('theme', () => {
	afterEach(() => {
		setTheme('dark');
		localStorage.clear();
	});

	it('is dark until the learner picks the light theme', () => {
		expect(rememberedTheme()).toBe('dark');
		expect(currentTheme()).toBe('dark');
		expect(document.documentElement.dataset.theme).toBeUndefined();
	});

	it('shows and remembers the light theme, and forgets it on the way back to dark', () => {
		setTheme('light');

		expect(currentTheme()).toBe('light');
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(rememberedTheme()).toBe('light');

		setTheme('dark');

		expect(currentTheme()).toBe('dark');
		expect(document.documentElement.dataset.theme).toBeUndefined();
		expect(rememberedTheme()).toBe('dark');
	});

	it('sets the remembered light theme before the app starts', () => {
		setTheme('light');
		delete document.documentElement.dataset.theme;

		runThemeScript();

		expect(document.documentElement.dataset.theme).toBe('light');
	});

	it('leaves the dark theme when nothing is remembered', () => {
		runThemeScript();

		expect(document.documentElement.dataset.theme).toBeUndefined();
	});
});
