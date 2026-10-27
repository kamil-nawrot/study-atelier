import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { TurnstileApi, TurnstileOptions } from '#lib/auth/turnstile/turnstile.ts';
import Turnstile from './Turnstile.svelte';

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

let options: TurnstileOptions | undefined;
const api = {
	render: vi.fn((_container: HTMLElement, given: TurnstileOptions) => {
		options = given;
		return 'widget-1';
	}),
	reset: vi.fn(),
	remove: vi.fn()
};

beforeEach(() => {
	options = undefined;
	api.render.mockClear();
	api.reset.mockClear();
	api.remove.mockClear();
	(window as TurnstileWindow).turnstile = api;
});

afterEach(() => {
	delete (window as TurnstileWindow).turnstile;
});

describe('Turnstile', () => {
	it('shows nothing and sends no token without a site key', async () => {
		const { component, container } = await render(Turnstile, {});

		await expect(component.getToken()).resolves.toBeUndefined();
		expect(container.querySelector('.turnstile')).toBeNull();
		expect(api.render).not.toHaveBeenCalled();
	});

	it('appears only when Cloudflare needs the learner, fills the form and speaks Polish', async () => {
		await render(Turnstile, { sitekey: 'site-key' });

		await vi.waitFor(() => expect(options).toBeDefined());
		expect(options).toMatchObject({
			sitekey: 'site-key',
			appearance: 'interaction-only',
			size: 'flexible',
			language: 'pl'
		});
	});

	it('waits for the token and hands it out until reset', async () => {
		const { component } = await render(Turnstile, { sitekey: 'site-key' });
		await vi.waitFor(() => expect(options).toBeDefined());

		const token = component.getToken();
		options?.callback('token-1');
		await expect(token).resolves.toBe('token-1');
		await expect(component.getToken()).resolves.toBe('token-1');

		component.reset();
		expect(api.reset).toHaveBeenCalledWith('widget-1');
		const next = component.getToken();
		options?.callback('token-2');
		await expect(next).resolves.toBe('token-2');
	});

	it('keeps waiting after a failed check and takes the token of the retry', async () => {
		const { component } = await render(Turnstile, { sitekey: 'site-key' });
		await vi.waitFor(() => expect(options).toBeDefined());
		expect(options?.['retry-interval']).toBe(1500);

		const token = component.getToken();
		options?.['error-callback']();
		options?.callback('token-after-retry');
		await expect(token).resolves.toBe('token-after-retry');
	});

	it('restarts a failed check at once when the learner submits', async () => {
		const { component } = await render(Turnstile, { sitekey: 'site-key', timeout: 50 });
		await vi.waitFor(() => expect(options).toBeDefined());

		options?.['error-callback']();
		const token = component.getToken();
		expect(api.reset).toHaveBeenCalledWith('widget-1');
		await expect(token).resolves.toBeUndefined();
	});

	it('takes space in the form only while Cloudflare asks the learner', async () => {
		const { container } = await render(Turnstile, { sitekey: 'site-key' });
		await vi.waitFor(() => expect(options).toBeDefined());
		const widget = container.querySelector('.turnstile');

		expect(widget).toHaveClass('visually-hidden');
		options?.['before-interactive-callback']();
		await vi.waitFor(() => expect(widget).not.toHaveClass('visually-hidden'));
		options?.['after-interactive-callback']();
		await vi.waitFor(() => expect(widget).toHaveClass('visually-hidden'));
	});

	it('removes the widget when the form goes away', async () => {
		const { unmount } = await render(Turnstile, { sitekey: 'site-key' });
		await vi.waitFor(() => expect(options).toBeDefined());

		unmount();
		expect(api.remove).toHaveBeenCalledWith('widget-1');
	});
});
