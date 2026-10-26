import { describe, expect, it, vi } from 'vitest';
import { loadTurnstile, pageTheme, type TurnstileApi } from './turnstile.ts';

const api: TurnstileApi = { render: vi.fn(), reset: vi.fn(), remove: vi.fn() };

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

function fakeWindow(): TurnstileWindow {
	return { document: document.implementation.createHTMLDocument() } as TurnstileWindow;
}

function scripts(target: TurnstileWindow): HTMLScriptElement[] {
	return [...target.document.head.querySelectorAll('script')];
}

describe('loadTurnstile', () => {
	it('uses the script already on the page', async () => {
		const target = fakeWindow();
		target.turnstile = api;
		await expect(loadTurnstile(target)).resolves.toBe(api);
		expect(scripts(target)).toHaveLength(0);
	});

	it('loads the script once for explicit rendering', async () => {
		const target = fakeWindow();
		const first = loadTurnstile(target);
		const second = loadTurnstile(target);
		expect(scripts(target)).toHaveLength(1);
		expect(scripts(target)[0].src).toContain('render=explicit');
		target.turnstile = api;
		scripts(target)[0].dispatchEvent(new Event('load'));
		await expect(first).resolves.toBe(api);
		await expect(second).resolves.toBe(api);
	});

	it('tries again after the script fails to load', async () => {
		const target = fakeWindow();
		const first = loadTurnstile(target);
		scripts(target)[0].dispatchEvent(new Event('error'));
		await expect(first).rejects.toThrow();

		const second = loadTurnstile(target);
		expect(scripts(target)).toHaveLength(2);
		target.turnstile = api;
		scripts(target)[1].dispatchEvent(new Event('load'));
		await expect(second).resolves.toBe(api);
	});
});

describe('pageTheme', () => {
	it('follows the light theme and falls back to the dark one', () => {
		const root = document.createElement('html');
		expect(pageTheme(root)).toBe('dark');
		root.dataset.theme = 'light';
		expect(pageTheme(root)).toBe('light');
	});
});
