import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import ArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

describe('artwork page', () => {
	it('names the artwork by its record number', async () => {
		render(ArtworkPage, { data: { session: testSession() }, params: { number: '42' } });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.comingSoon.artwork('#0042'));
		await expect
			.element(page.getByRole('link', { name: m.comingSoon.backToAtelier }))
			.toHaveAttribute('href', '/atelier');
	});
});
