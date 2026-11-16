import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import ReviewKnowledge from './ReviewKnowledge.svelte';

describe('ReviewKnowledge', () => {
	it('shows nothing for an empty atelier', async () => {
		const { container } = await render(ReviewKnowledge, {
			knowledge: { settled: 0, learning: 0, fresh: 0 },
			troubles: [testArtwork(1, 'The Milkmaid')]
		});

		expect(container.querySelector('aside')).toBeNull();
	});

	it('shows how well the atelier is known', async () => {
		render(ReviewKnowledge, {
			knowledge: { settled: 4, learning: 2, fresh: 1 },
			troubles: []
		});

		await expect.element(page.getByRole('heading', { name: m.review.knowledge })).toBeVisible();
		await expect.element(page.getByText(m.review.knowledgeGroups.settled.label)).toBeVisible();
		await expect.element(page.getByText(m.review.knowledgeGroups.learning.label)).toBeVisible();
		await expect.element(page.getByText(m.review.knowledgeGroups.fresh.label)).toBeVisible();
	});

	it('leaves out the troubles section when nothing gave trouble', async () => {
		render(ReviewKnowledge, {
			knowledge: { settled: 1, learning: 0, fresh: 0 },
			troubles: []
		});

		await expect
			.element(page.getByRole('heading', { name: m.review.troubles }))
			.not.toBeInTheDocument();
	});

	it('lists the artworks that gave trouble as links to their cards', async () => {
		render(ReviewKnowledge, {
			knowledge: { settled: 1, learning: 1, fresh: 0 },
			troubles: [testArtwork(7, 'The Milkmaid'), testArtwork(12, 'The Astronomer')]
		});

		await expect.element(page.getByRole('heading', { name: m.review.troubles })).toBeVisible();
		const links = page.getByRole('link');
		await expect.element(links.first()).toHaveAttribute('href', expect.stringContaining('/7'));
		await expect.element(links.last()).toHaveAttribute('href', expect.stringContaining('/12'));
		await expect.element(page.getByText('The Astronomer')).toBeVisible();
	});
});
