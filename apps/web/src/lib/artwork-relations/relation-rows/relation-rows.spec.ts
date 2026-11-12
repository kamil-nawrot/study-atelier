import { describe, expect, it } from 'vitest';
import {
	emptyRelationRow,
	relationEntriesOf,
	relationRowsOf,
	relationsFromRows
} from './relation-rows.ts';

const sketch = { id: 'sketch', number: 1, title: 'Sketch' };
const copy = { id: 'copy', number: 2, title: 'Copy' };

describe('relationsFromRows', () => {
	it('names the outgoing relations from their start and the incoming ones from their end', () => {
		expect(
			relationsFromRows(
				[
					{
						kind: 'study',
						artwork: { id: 'sketch', record_number: 1, title: 'Sketch', deleted_at: null }
					}
				],
				[
					{
						kind: 'study',
						artwork: { id: 'copy', record_number: 2, title: 'Copy', deleted_at: null }
					}
				]
			)
		).toEqual([
			{ type: 'studyFrom', artwork: sketch },
			{ type: 'studyTo', artwork: copy }
		]);
	});

	it('leaves out an artwork in the trash, one it cannot read and a kind it does not know', () => {
		expect(
			relationsFromRows(
				[
					{
						kind: 'study',
						artwork: { id: 'gone', record_number: 3, title: 'Gone', deleted_at: '2026-11-01' }
					},
					{ kind: 'study', artwork: null },
					{
						kind: 'pendant',
						artwork: { id: 'copy', record_number: 2, title: 'Copy', deleted_at: null }
					}
				],
				undefined
			)
		).toEqual([]);
	});
});

describe('relationRowsOf', () => {
	it('lists the rows of the form in the order of the view', () => {
		expect(
			relationRowsOf([
				{ type: 'related', artwork: sketch },
				{ type: 'studyTo', artwork: copy }
			])
		).toEqual([
			{ key: 'copy', type: 'studyTo', artwork: copy },
			{ key: 'sketch', type: 'related', artwork: sketch }
		]);
	});
});

describe('relationEntriesOf', () => {
	it('turns an empty type into no type and drops the keys', () => {
		expect(
			relationEntriesOf([emptyRelationRow('new'), { key: 'copy', type: 'copyFrom', artwork: copy }])
		).toEqual([
			{ type: null, artwork: null },
			{ type: 'copyFrom', artwork: copy }
		]);
	});
});
