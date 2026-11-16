import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { loadConfusedPairs, loadReviewDetails } from '#lib/review/review-data/review-data.ts';
import { loadReviewRelations } from '#lib/review/relation-questions-data/relation-questions-data.ts';
import { loadExtraSteps } from './extra-steps.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({
	loadConfusedPairs: vi.fn(),
	loadReviewDetails: vi.fn()
}));
vi.mock('#lib/review/relation-questions-data/relation-questions-data.ts', () => ({
	loadReviewRelations: vi.fn().mockResolvedValue({ artworks: [], authors: [] })
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermDefinitions: vi.fn().mockResolvedValue({ definitions: new Map() })
}));
vi.mock('#lib/review/symbol-steps/symbol-steps.ts', () => ({
	loadSymbolSteps: vi.fn().mockResolvedValue([])
}));
vi.mock('#lib/review/extra-cards-data/extra-cards-data.ts', async () => ({
	loadExtraCards: vi
		.fn()
		.mockResolvedValue((await import('#lib/review/extra-cards/extra-cards.ts')).NO_EXTRA_CARDS)
}));
vi.mock('#lib/review/note-gap/note-gap.ts', () => ({
	drawNoteGap: vi.fn().mockResolvedValue([])
}));

const monet = testArtwork(1, 'Impression', { authors: ['Claude Monet'] });
const manet = testArtwork(2, 'Olympia', { authors: ['Édouard Manet'] });

function images(): ResolvedImages {
	return {
		resolve: vi.fn().mockResolvedValue(undefined),
		withImage: (artwork: typeof monet) => ({ ...artwork, title: `${artwork.title} (shown)` })
	} as unknown as ResolvedImages;
}

function input(): Parameters<typeof loadExtraSteps>[0] {
	return {
		preferences: { ...defaultPreferences, reviewGlossaryOn: false, reviewSymbolQuestions: 0 },
		glossary: [],
		scope: { kind: 'all' },
		asked: [monet],
		shown: [monet],
		atelier: [monet, manet],
		artworksById: new Map(),
		images: images(),
		times: []
	};
}

describe('loadExtraSteps', () => {
	it('adds the confused pairs with the images of their artworks', async () => {
		vi.mocked(loadConfusedPairs).mockResolvedValue([
			{ kind: 'author', first: 'Claude Monet', second: 'Édouard Manet' }
		]);
		vi.mocked(loadReviewDetails).mockResolvedValue({ details: new Map() });

		const { steps, error } = await loadExtraSteps(input());

		expect(error).toBeUndefined();
		expect(steps).toHaveLength(1);
		expect(steps[0]).toMatchObject({ mode: 'quiz_pair', kind: 'author' });
		const titles =
			steps[0].mode === 'quiz_pair'
				? steps[0].quiz.options.map((option) => option.artwork?.title).sort()
				: [];
		expect(titles).toEqual(['Impression (shown)', 'Olympia (shown)']);
	});

	it('adds a relation question with the image of its artwork and loads its credit', async () => {
		const atelier = [
			monet,
			manet,
			testArtwork(3, 'The Kiss'),
			testArtwork(4, 'Danaë'),
			testArtwork(5, 'Water Lilies')
		];
		vi.mocked(loadConfusedPairs).mockResolvedValue([]);
		vi.mocked(loadReviewRelations).mockResolvedValueOnce({
			artworks: [{ kind: 'reference', from: manet.id, to: monet.id }],
			authors: []
		});
		vi.mocked(loadReviewDetails).mockResolvedValue({ details: new Map() });

		const { steps } = await loadExtraSteps({ ...input(), atelier });

		expect(steps).toHaveLength(1);
		expect(steps[0]).toMatchObject({ mode: 'quiz_relation' });
		expect(steps[0].mode === 'quiz_relation' && steps[0].artwork.title).toMatch(/\(shown\)$/);
		expect(vi.mocked(loadReviewDetails).mock.lastCall?.[0]).toHaveLength(2);
	});

	it('passes on the error of the details', async () => {
		vi.mocked(loadConfusedPairs).mockResolvedValue([]);
		vi.mocked(loadReviewDetails).mockResolvedValue({ details: new Map(), error: 'offline' });

		await expect(loadExtraSteps(input())).resolves.toMatchObject({ steps: [], error: 'offline' });
	});
});
