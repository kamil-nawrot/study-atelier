import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	groupRelations,
	isArtworkRelationType,
	relationError,
	relationPayload,
	relationTypeOf,
	relationTypeOptions
} from './relation-types.ts';

const sketch = { id: 'sketch', number: 1, title: 'Sketch' };
const copy = { id: 'copy', number: 2, title: 'Copy' };
const altarpiece = { id: 'altarpiece', number: 3, title: 'Altarpiece' };

describe('relationTypeOf', () => {
	it('names a relation from the end the artwork stands on', () => {
		expect(relationTypeOf('study', 'from')).toBe('studyFrom');
		expect(relationTypeOf('study', 'to')).toBe('studyTo');
		expect(relationTypeOf('part', 'to')).toBe('partTo');
	});

	it('gives a symmetric relation one name for both ends', () => {
		expect(relationTypeOf('version', 'to')).toBe('version');
		expect(relationTypeOf('related', 'from')).toBe('related');
	});

	it('knows no kind outside the list', () => {
		expect(relationTypeOf('pendant', 'from')).toBeUndefined();
		expect(isArtworkRelationType('pendant')).toBe(false);
		expect(isArtworkRelationType('copyTo')).toBe(true);
	});
});

describe('relationTypeOptions', () => {
	it('lists both ends of every kind in the order of the decision', () => {
		expect(relationTypeOptions().map((option) => option.label)).toEqual([
			m.artworkRelations.types.studyFrom,
			m.artworkRelations.types.studyTo,
			m.artworkRelations.types.copyFrom,
			m.artworkRelations.types.copyTo,
			m.artworkRelations.types.version,
			m.artworkRelations.types.partFrom,
			m.artworkRelations.types.partTo,
			m.artworkRelations.types.referenceFrom,
			m.artworkRelations.types.referenceTo,
			m.artworkRelations.types.related
		]);
	});
});

describe('groupRelations', () => {
	it('groups the artworks by type in the order of the list and by title inside a group', () => {
		expect(
			groupRelations([
				{ type: 'related', artwork: sketch },
				{ type: 'partFrom', artwork: copy },
				{ type: 'partFrom', artwork: altarpiece }
			])
		).toEqual([
			{ type: 'partFrom', label: m.artworkRelations.types.partFrom, artworks: [altarpiece, copy] },
			{ type: 'related', label: m.artworkRelations.types.related, artworks: [sketch] }
		]);
	});
});

describe('relationError', () => {
	it('asks first for the artwork, then for the kind', () => {
		expect(relationError([])).toBeUndefined();
		expect(relationError([{ type: 'studyFrom', artwork: sketch }])).toBeUndefined();
		expect(
			relationError([
				{ type: null, artwork: sketch },
				{ type: null, artwork: null }
			])
		).toBe(m.artworkRelations.artworkRequired);
		expect(relationError([{ type: null, artwork: sketch }])).toBe(m.artworkRelations.typeRequired);
	});
});

describe('relationPayload', () => {
	it('sends the kind, the end and the other artwork, and leaves out an unfinished row', () => {
		expect(
			relationPayload([
				{ type: 'copyTo', artwork: copy },
				{ type: 'version', artwork: sketch },
				{ type: null, artwork: altarpiece }
			])
		).toEqual([
			{ kind: 'copy', side: 'to', artwork_id: 'copy' },
			{ kind: 'version', side: 'from', artwork_id: 'sketch' }
		]);
	});
});
