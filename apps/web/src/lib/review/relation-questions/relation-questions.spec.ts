import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { ReviewRelations } from '#lib/review/types/review-relations.ts';
import { relationItems } from './relation-questions.ts';

const study = testArtwork(1, 'Head of a Woman', { authors: ['Leonardo da Vinci'] });
const painting = testArtwork(2, 'Madonna Litta', { authors: ['Leonardo da Vinci'] });
const others = [
	testArtwork(3, 'The Kiss', { authors: ['Gustav Klimt'] }),
	testArtwork(4, 'Olympia', { authors: ['Édouard Manet'] }),
	testArtwork(5, 'Impression, Sunrise', { authors: ['Claude Monet'] })
];
const atelier = [study, painting, ...others];

function first(): number {
	return 0;
}

function relations(overrides: Partial<ReviewRelations> = {}): ReviewRelations {
	return { artworks: [], authors: [], ...overrides };
}

describe('relationItems', () => {
	it('asks for the other end of an artwork relation among artworks not related to it', () => {
		const items = relationItems(
			relations({ artworks: [{ kind: 'study', from: study.id, to: painting.id }] }),
			atelier,
			2,
			first
		);

		expect(items).toHaveLength(1);
		const [item] = items;
		expect(['studyFrom', 'studyTo']).toContain(item.question);
		const right = item.question === 'studyFrom' ? painting : study;
		expect(item.artwork.id).toBe(item.question === 'studyFrom' ? study.id : painting.id);
		expect(item.quiz.options[item.quiz.answer].label).toBe(right.title);
		expect(item.quiz.options.map((option) => option.label).sort()).toEqual(
			[right.title, ...others.map((artwork) => artwork.title)].sort()
		);
	});

	it('shows an artwork of the author asked about and offers other authors', () => {
		const items = relationItems(
			relations({ authors: [{ kind: 'pupil', from: 'Leonardo da Vinci', to: 'Verrocchio' }] }),
			atelier,
			1,
			() => 0.99
		);

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ question: 'pupilFrom', author: 'Leonardo da Vinci' });
		expect(items[0].artwork.authors).toContain('Leonardo da Vinci');
		const labels = items[0].quiz.options.map((option) => option.label);
		expect(labels[items[0].quiz.answer]).toBe('Verrocchio');
		expect(labels).not.toContain('Leonardo da Vinci');
		expect(labels).toHaveLength(4);
	});

	it('skips a relation without three other answers or without an image to show', () => {
		const small = [study, painting, others[0]];
		expect(
			relationItems(
				relations({ artworks: [{ kind: 'study', from: study.id, to: painting.id }] }),
				small,
				2
			)
		).toEqual([]);
		expect(
			relationItems(
				relations({ authors: [{ kind: 'family', from: 'Hans Holbein', to: 'Ambrosius Holbein' }] }),
				atelier,
				2
			)
		).toEqual([]);
		const hidden = atelier.map((artwork) => ({ ...artwork, hasImage: false }));
		expect(
			relationItems(
				relations({ artworks: [{ kind: 'copy', from: study.id, to: painting.id }] }),
				hidden,
				2
			)
		).toEqual([]);
	});

	it('asks a relation once and stops at the count', () => {
		const items = relationItems(
			relations({
				artworks: [
					{ kind: 'version', from: study.id, to: painting.id },
					{ kind: 'reference', from: others[0].id, to: others[1].id }
				]
			}),
			[...atelier, testArtwork(6, 'Danaë'), testArtwork(7, 'Water Lilies')],
			5
		);

		expect(items.map((item) => item.key).sort()).toEqual(
			[`artwork:${study.id}|${painting.id}`, `artwork:${others[0].id}|${others[1].id}`].sort()
		);
		expect(
			relationItems(
				relations({ artworks: [{ kind: 'version', from: study.id, to: painting.id }] }),
				atelier,
				0
			)
		).toEqual([]);
	});
});
