import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ContextTags from './ContextTags.svelte';

describe('ContextTags', () => {
	it('links each label to its page and names its kind', async () => {
		render(ContextTags, {
			contexts: [
				{ kind: 'value', valueId: 'v1', category: 'style', name: 'Tenebrism' },
				{ kind: 'era', eraCode: 'modern', name: 'nowoczesność' },
				{ kind: 'artwork', artworkId: 'a1', number: 12, name: 'The Ambassadors' },
				{ kind: 'person', entryId: 't1', name: 'Saint Peter' },
				{ kind: 'text', name: 'heraldry' }
			]
		});

		await expect
			.element(page.getByRole('link', { name: /Tenebrism/ }))
			.toHaveAttribute('href', '/atelier/values/style/v1');
		await expect
			.element(page.getByRole('link', { name: /nowoczesność/ }))
			.toHaveAttribute('href', '/atelier/values/era/modern');
		await expect
			.element(page.getByRole('link', { name: /The Ambassadors/ }))
			.toHaveAttribute('href', '/atelier/12');
		const peter = page.getByRole('link', { name: /Saint Peter/ });
		await expect.element(peter).toHaveAttribute('href', '/atelier/glossary/t1');
		await expect.element(peter).toHaveTextContent(m.symbols.contextKinds.person);
		await expect.element(page.getByText('heraldry')).toBeVisible();
		await expect.element(page.getByRole('link', { name: /heraldry/ })).not.toBeInTheDocument();
	});

	it('says a meaning without labels holds everywhere', async () => {
		render(ContextTags, { contexts: [] });

		await expect.element(page.getByText(m.symbols.view.general)).toBeVisible();
	});
});
