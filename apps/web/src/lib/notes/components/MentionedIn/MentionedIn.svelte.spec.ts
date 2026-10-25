import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MentionedIn from './MentionedIn.svelte';

describe('MentionedIn', () => {
	it('lists the notes that link there, with their kind', async () => {
		render(MentionedIn, {
			mentions: [
				{ href: '/atelier/values/author/a1', name: 'Phidias', kind: 'Autor' },
				{ href: '/atelier/3', name: '#0003 Doric temple', kind: m.mentions.artwork }
			]
		});

		await expect
			.element(page.getByRole('heading', { name: m.mentions.heading }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: 'Phidias' }))
			.toHaveAttribute('href', '/atelier/values/author/a1');
		await expect
			.element(page.getByRole('link', { name: '#0003 Doric temple' }))
			.toHaveAttribute('href', '/atelier/3');
		await expect.element(page.getByText('Autor')).toBeVisible();
	});

	it('is left out when nothing links there', async () => {
		render(MentionedIn, { mentions: [] });

		await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
	});
});
