import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { contextCandidates } from './context-candidates.ts';

describe('contextCandidates', () => {
	it('offers the eras, the card index values and the persons of the glossary', () => {
		const candidates = contextCandidates(
			{
				values: [{ id: 'v1', category: 'style', name: 'Tenebrism', count: 2 }],
				periodEras: [],
				stylePeriods: []
			},
			[
				{
					id: 't1',
					name: 'Saint Peter',
					category: 'person',
					synonyms: [],
					forms: [],
					hasDefinition: false
				},
				{
					id: 't2',
					name: 'Apse',
					category: 'architecture',
					synonyms: [],
					forms: [],
					hasDefinition: true
				}
			]
		);

		expect(candidates).toContainEqual({ kind: 'era', eraCode: 'modern', name: m.eras.modern.name });
		expect(candidates).toContainEqual({
			kind: 'value',
			valueId: 'v1',
			category: 'style',
			name: 'Tenebrism'
		});
		expect(candidates).toContainEqual({ kind: 'person', entryId: 't1', name: 'Saint Peter' });
		expect(candidates.some((candidate) => candidate.name === 'Apse')).toBe(false);
	});
});
