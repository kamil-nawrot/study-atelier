import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	authorRelationError,
	authorRelationPayload,
	authorRelationRowsOf,
	authorRelationsOfRows,
	authorRelationTypeOf,
	authorRelationTypeOptions,
	emptyAuthorRelationRow,
	groupAuthorRelations,
	isAuthorRelationType
} from './author-relation-types.ts';

const verrocchio = { id: 'verrocchio', name: 'Verrocchio' };
const raphael = { id: 'raphael', name: 'Raphael' };
const giorgione = { id: 'giorgione', name: 'Giorgione' };

describe('authorRelationTypeOf', () => {
	it('names a relation from the end the author stands on', () => {
		expect(authorRelationTypeOf('pupil', 'from')).toBe('pupilFrom');
		expect(authorRelationTypeOf('pupil', 'to')).toBe('pupilTo');
		expect(authorRelationTypeOf('influence', 'to')).toBe('influenceTo');
	});

	it('gives a symmetric relation one name for both ends', () => {
		expect(authorRelationTypeOf('family', 'to')).toBe('family');
		expect(authorRelationTypeOf('collaboration', 'to')).toBe('collaboration');
		expect(authorRelationTypeOf('related', 'from')).toBe('related');
	});

	it('knows no kind outside the list', () => {
		expect(authorRelationTypeOf('rival', 'from')).toBeUndefined();
		expect(isAuthorRelationType('rival')).toBe(false);
		expect(isAuthorRelationType('pupilTo')).toBe(true);
	});
});

describe('authorRelationTypeOptions', () => {
	it('lists both ends of every kind in the order of the decision', () => {
		expect(authorRelationTypeOptions().map((option) => option.label)).toEqual([
			m.authorRelations.types.pupilFrom,
			m.authorRelations.types.pupilTo,
			m.authorRelations.types.influenceFrom,
			m.authorRelations.types.influenceTo,
			m.authorRelations.types.collaboration,
			m.authorRelations.types.family,
			m.authorRelations.types.related
		]);
	});
});

describe('groupAuthorRelations', () => {
	it('groups the authors by type in the order of the list and by name', () => {
		const groups = groupAuthorRelations([
			{ type: 'influenceTo', author: raphael },
			{ type: 'pupilFrom', author: verrocchio },
			{ type: 'influenceTo', author: giorgione }
		]);

		expect(groups).toEqual([
			{ type: 'pupilFrom', label: m.authorRelations.types.pupilFrom, authors: [verrocchio] },
			{
				type: 'influenceTo',
				label: m.authorRelations.types.influenceTo,
				authors: [giorgione, raphael]
			}
		]);
	});
});

describe('rows', () => {
	it('turns relations into rows and complete rows back into relations', () => {
		const rows = authorRelationRowsOf([
			{ type: 'influenceTo', author: raphael },
			{ type: 'pupilFrom', author: verrocchio }
		]);

		expect(rows.map((row) => row.key)).toEqual(['verrocchio', 'raphael']);
		expect(authorRelationsOfRows([...rows, emptyAuthorRelationRow('new')])).toEqual([
			{ type: 'pupilFrom', author: verrocchio },
			{ type: 'influenceTo', author: raphael }
		]);
	});

	it('asks first for the author, then for the type of an unfinished row', () => {
		expect(authorRelationError([])).toBeUndefined();
		expect(authorRelationError([emptyAuthorRelationRow('new')])).toBe(
			m.authorRelations.authorRequired
		);
		expect(authorRelationError([{ key: 'r', type: '', author: raphael }])).toBe(
			m.authorRelations.typeRequired
		);
	});
});

describe('authorRelationPayload', () => {
	it('sends the kind, the end of the author and the other author', () => {
		expect(
			authorRelationPayload([
				{ type: 'pupilTo', author: raphael },
				{ type: 'family', author: giorgione }
			])
		).toEqual([
			{ kind: 'pupil', side: 'to', author_id: 'raphael' },
			{ kind: 'family', side: 'from', author_id: 'giorgione' }
		]);
	});
});
