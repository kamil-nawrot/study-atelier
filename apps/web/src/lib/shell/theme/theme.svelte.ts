import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';
export const THEME_SLOT = '<!--theme-->';

const THEME_KEY = 'study-atelier:theme';

export const themeScript = `<script>try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==='light')document.documentElement.dataset.theme='light'}catch{}</script>`;

export function isTheme(value: unknown): value is Theme {
	return value === 'dark' || value === 'light';
}

export function rememberedTheme(): Theme {
	const stored = readStored('local', THEME_KEY);
	return isTheme(stored) ? stored : DEFAULT_THEME;
}

function rememberTheme(theme: Theme): void {
	writeStored('local', THEME_KEY, theme === DEFAULT_THEME ? null : theme);
}

function shownTheme(): Theme {
	if (typeof document === 'undefined') return DEFAULT_THEME;
	return document.documentElement.dataset.theme === 'light' ? 'light' : DEFAULT_THEME;
}

let current = $state<Theme>(shownTheme());

export function currentTheme(): Theme {
	return current;
}

export function setTheme(theme: Theme): void {
	current = theme;
	if (theme === DEFAULT_THEME) delete document.documentElement.dataset.theme;
	else document.documentElement.dataset.theme = theme;
	rememberTheme(theme);
}
