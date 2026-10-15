export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';
export const THEME_SLOT = '<!--theme-->';

const THEME_KEY = 'study-atelier:theme';

export const themeScript = `<script>try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==='light')document.documentElement.dataset.theme='light'}catch{}</script>`;

export function isTheme(value: unknown): value is Theme {
	return value === 'dark' || value === 'light';
}

export function rememberedTheme(): Theme {
	try {
		const stored = localStorage.getItem(THEME_KEY);
		return isTheme(stored) ? stored : DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
}

function rememberTheme(theme: Theme): void {
	try {
		if (theme === DEFAULT_THEME) localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, theme);
	} catch {
		return;
	}
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
