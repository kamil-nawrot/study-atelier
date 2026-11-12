import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ArtworkRelations from './ArtworkRelations.svelte';

describe('ArtworkRelations', () => {
	it('shows nothing when the artwork has no relation', async () => {
		render(ArtworkRelations, { relations: [] });

		await expect.element(page.getByText(m.artworkRelations.title)).not.toBeInTheDocument();
	});

	it('groups the related artworks by type and links each title to its card', async () => {
		render(ArtworkRelations, {
			relations: [
				{ type: 'referenceTo', artwork: { id: 'kiss', number: 7, title: 'The Kiss' } },
				{ type: 'studyTo', artwork: { id: 'study', number: 10, title: 'Untitled study' } }
			]
		});

		const headings = page.getByRole('heading', { level: 3 });
		await expect.element(headings.first()).toHaveTextContent(m.artworkRelations.types.studyTo);
		await expect.element(headings.last()).toHaveTextContent(m.artworkRelations.types.referenceTo);
		await expect
			.element(page.getByRole('link', { name: 'The Kiss' }))
			.toHaveAttribute('href', expect.stringMatching(/\/atelier\/7$/));
	});
});
