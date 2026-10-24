import { describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { LOADING_SCREEN_SLOT } from '#lib/startup/loading-screen.ts';
import { THEME_SLOT, themeScript } from '#lib/shell/theme/theme.svelte.ts';
import { handle } from './hooks.server.ts';

type HandleInput = Parameters<typeof handle>[0];
type ResolveOptions = { transformPageChunk: (input: { html: string; done: boolean }) => string };

describe('server handle', () => {
	it('puts the loading screen into the page shell', async () => {
		const resolve = vi.fn(async (_event: unknown, options: ResolveOptions) => {
			const html = options.transformPageChunk({
				html: `<body>${LOADING_SCREEN_SLOT}</body>`,
				done: true
			});
			return new Response(html);
		});

		const response = await handle({ event: {}, resolve } as unknown as HandleInput);
		const html = await response.text();

		expect(html).not.toContain(LOADING_SCREEN_SLOT);
		expect(html).toContain('role="status"');
		expect(html).toContain(`aria-label="${m.ui.loading}"`);
	});

	it('puts the script that sets the remembered theme into the head', async () => {
		const resolve = vi.fn(async (_event: unknown, options: ResolveOptions) => {
			const html = options.transformPageChunk({
				html: `<head>${THEME_SLOT}</head><body>${LOADING_SCREEN_SLOT}</body>`,
				done: true
			});
			return new Response(html);
		});

		const response = await handle({ event: {}, resolve } as unknown as HandleInput);
		const html = await response.text();

		expect(html).not.toContain(THEME_SLOT);
		expect(html).toContain(`<head>${themeScript}</head>`);
	});
});
