import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import LegalLinks from './LegalLinks.svelte';

describe('LegalLinks', () => {
	it('links to the terms and the privacy policy', async () => {
		render(LegalLinks);

		const links = page.getByRole('navigation', { name: m.legal.linksLabel });
		await expect
			.element(links.getByRole('link', { name: m.legal.terms }))
			.toHaveAttribute('href', '/terms');
		await expect
			.element(links.getByRole('link', { name: m.legal.privacy }))
			.toHaveAttribute('href', '/privacy');
	});
});
