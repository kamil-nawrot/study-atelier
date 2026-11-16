import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
import { m } from '#lib/i18n/i18n.ts';
import { flagRows, missingRows } from './backroom-rows.ts';

const jerome = testArtwork(12, 'Saint Jerome', { id: 'artwork-12', styles: ['Baroque'] });
const david = testArtwork(3, 'David', { id: 'artwork-3', yearTo: null, hasImage: false });
const vanitas = { id: 'term-1', name: 'Vanitas', hasDefinition: true };
const tympanum = { id: 'term-2', name: 'Tympanum', hasDefinition: false };

function flag(extra: Partial<FlagRecord>): FlagRecord {
	return {
		id: 'flag-1',
		reason: 'other',
		comment: null,
		question: null,
		artworkId: null,
		termId: null,
		symbolId: null,
		symbolName: null,
		imageNumber: null,
		holds: false,
		...extra
	};
}

describe('flag rows', () => {
	it('opens the artwork form at the image with its number and the comment', () => {
		const [row] = flagRows(
			[flag({ artworkId: 'artwork-12', reason: 'image', imageNumber: 2, comment: 'Blurry' })],
			[jerome],
			[]
		);
		const reason = `${m.backroom.reasons.image} (${m.backroom.imageNumber(2)})`;
		expect(row).toMatchObject({
			kind: 'artwork',
			title: 'Saint Jerome',
			reason,
			origin: m.backroom.origins.artwork,
			comment: 'Blurry',
			entry: {
				key: 'flag:flag-1',
				path: '/atelier/12/edit',
				field: 'image',
				note: m.backroom.note(reason, 'Blurry'),
				flagId: 'flag-1'
			}
		});
	});

	it('marks a flag that holds its question in the reviews', () => {
		const [row] = flagRows(
			[flag({ artworkId: 'artwork-12', reason: 'pin', holds: true })],
			[jerome],
			[]
		);
		expect(row.held).toBe(true);
		expect(flagRows([flag({ artworkId: 'artwork-12' })], [jerome], [])[0]).not.toHaveProperty(
			'held'
		);
	});

	it('says which question or note a flag came from', () => {
		const rows = flagRows(
			[
				flag({
					id: 'flag-1',
					termId: 'term-1',
					reason: 'hidden',
					question: { mode: 'note_gap', text: m.review.quiz.noteQuestion, note: 12 }
				}),
				flag({
					id: 'flag-2',
					artworkId: 'artwork-12',
					reason: 'answers',
					question: { mode: 'quiz_author', text: m.review.quiz.authorQuestion }
				})
			],
			[jerome],
			[vanitas]
		);
		expect(rows.map((row) => [row.origin, row.entry.path, row.entry.field])).toEqual([
			[m.backroom.origins.note('#0012'), '/atelier/glossary/term-1/edit', 'forms'],
			[m.backroom.origins.question(m.review.quiz.authorQuestion), '/atelier/12/edit', 'data']
		]);
	});

	it('opens the meanings of a symbol on its page and something else in its form', () => {
		const rows = flagRows(
			[
				flag({ id: 'flag-1', symbolId: 'symbol-1', symbolName: 'Skull', reason: 'meaning' }),
				flag({ id: 'flag-2', symbolId: 'symbol-1', symbolName: 'Skull', comment: 'Odd' })
			],
			[],
			[]
		);
		expect(rows.map((row) => [row.title, row.entry.path, row.entry.field])).toEqual([
			['Skull', '/atelier/glossary/symbols/symbol-1', 'meanings'],
			['Skull', '/atelier/glossary/symbols/symbol-1/edit', 'top']
		]);
	});

	it('leaves out flags of artworks in Archiwum and of deleted terms', () => {
		expect(
			flagRows(
				[flag({ artworkId: 'artwork-99', reason: 'data' }), flag({ termId: 'term-9' })],
				[jerome],
				[vanitas]
			)
		).toEqual([]);
	});
});

describe('missing rows', () => {
	it('lists the artworks by number with what they lack, then the terms without a definition', () => {
		const rows = missingRows([jerome, testArtwork(7, 'No style'), david], [vanitas, tympanum]);
		expect(rows.map((row) => [row.title, row.reason, row.entry.field, row.entry.path])).toEqual([
			[
				'David',
				[m.backroom.missing.style, m.backroom.missing.year, m.backroom.missing.image].join(' · '),
				'style',
				'/atelier/3/edit'
			],
			['No style', m.backroom.missing.style, 'style', '/atelier/7/edit'],
			['Tympanum', m.backroom.missing.definition, 'definition', '/atelier/glossary/term-2/edit']
		]);
		expect(rows[0].entry).not.toHaveProperty('flagId');
	});

	it('opens the year of an artwork that has a style', () => {
		const [row] = missingRows(
			[testArtwork(4, 'Undated', { styles: ['Gothic'], yearTo: null })],
			[]
		);
		expect(row.entry.field).toBe('year');
	});
});
