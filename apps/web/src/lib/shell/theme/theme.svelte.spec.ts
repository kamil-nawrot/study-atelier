import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import '@study-atelier/ui/styles.css';
import {
	currentTheme,
	rememberedTheme,
	setTheme,
	THEME_COLORS,
	themeScript
} from './theme.svelte.ts';

let meta: HTMLMetaElement;

function themeColor(): string | null {
	return meta.getAttribute('content');
}

function runThemeScript(): void {
	const source = themeScript.replace(/^<script>|<\/script>$/g, '');
	new Function(source)();
}

describe('theme', () => {
	beforeAll(() => {
		meta = document.createElement('meta');
		meta.name = 'theme-color';
		meta.content = THEME_COLORS.dark;
		document.head.appendChild(meta);
	});

	afterAll(() => meta.remove());

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

	it('gives the browser bar the background of the chosen theme', () => {
		setTheme('light');
		expect(themeColor()).toBe(THEME_COLORS.light);

		setTheme('dark');
		expect(themeColor()).toBe(THEME_COLORS.dark);
	});

	it('keeps the colours of the browser bar equal to the background tokens', () => {
		const background = (): string =>
			getComputedStyle(document.documentElement)
				.getPropertyValue('--color-bg')
				.trim()
				.toUpperCase();

		expect(background()).toBe(THEME_COLORS.dark);
		setTheme('light');
		expect(background()).toBe(THEME_COLORS.light);
	});

	it('sets the remembered light theme before the app starts', () => {
		setTheme('light');
		delete document.documentElement.dataset.theme;

		meta.content = THEME_COLORS.dark;

		runThemeScript();

		expect(document.documentElement.dataset.theme).toBe('light');
		expect(themeColor()).toBe(THEME_COLORS.light);
	});

	it('leaves the dark theme when nothing is remembered', () => {
		runThemeScript();

		expect(document.documentElement.dataset.theme).toBeUndefined();
	});
});
