const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export type TurnstileOptions = {
	sitekey: string;
	appearance: 'interaction-only';
	size: 'flexible';
	theme: 'light' | 'dark';
	language: string;
	callback: (token: string) => void;
	'expired-callback': () => void;
	'error-callback': () => void;
	'retry-interval': number;
	'before-interactive-callback': () => void;
	'after-interactive-callback': () => void;
};

export type TurnstileApi = {
	render: (container: HTMLElement, options: TurnstileOptions) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

const loading = new WeakMap<TurnstileWindow, Promise<TurnstileApi>>();

export function loadTurnstile(target: TurnstileWindow = window): Promise<TurnstileApi> {
	if (target.turnstile) return Promise.resolve(target.turnstile);
	const pending = loading.get(target);
	if (pending) return pending;
	const loaded = new Promise<TurnstileApi>((resolve, reject) => {
		const script = target.document.createElement('script');
		script.src = SCRIPT_URL;
		script.async = true;
		script.onload = () =>
			target.turnstile ? resolve(target.turnstile) : reject(new Error('turnstile'));
		script.onerror = () => {
			loading.delete(target);
			reject(new Error('turnstile'));
		};
		target.document.head.appendChild(script);
	});
	loading.set(target, loaded);
	return loaded;
}

export function pageTheme(root: HTMLElement = document.documentElement): 'light' | 'dark' {
	return root.dataset.theme === 'light' ? 'light' : 'dark';
}
