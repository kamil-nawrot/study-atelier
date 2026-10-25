import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import { describe, expect, it } from 'vitest';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import {
	buildTimeline,
	canDelete,
	emptyCardIndex,
	erasOfPeriod,
	findRecord,
	lockedPeriodIds,
	periodsOfStyle,
	planEraMove,
	planNameChange,
	valuesOf
} from './card-index.ts';

const index = testCardIndex();

function record(id: string): CardIndexRecord {
	const found = findRecord(index, id);
	if (!found) throw new Error(`missing ${id}`);
	return found;
}

describe('buildTimeline', () => {
	it('lists the six eras in their fixed order', () => {
		expect(buildTimeline(index).eras.map((era) => era.code)).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
	});

	it('puts the periods under their eras with their styles', () => {
		const { eras } = buildTimeline(index);

		expect(eras[1].periods).toEqual([
			{
				id: 'period-classical',
				name: 'Classical',
				count: 3,
				styles: [
					{ id: 'style-doric', name: 'Doric', count: 2 },
					{ id: 'style-ionic', name: 'Ionic', count: 1 }
				]
			}
		]);
		expect(eras[2].periods.map((period) => period.name)).toEqual(['Gothic']);
		expect(eras[2].periods[0].styles).toEqual([{ id: 'style-ionic', name: 'Ionic', count: 1 }]);
	});

	it('shows a period linked to several eras under each of them', () => {
		const { eras } = buildTimeline(index);

		expect(eras[3].periods.map((period) => period.name)).toEqual(['Classical']);
	});

	it('leaves eras without periods empty', () => {
		const { eras } = buildTimeline(index);

		expect(eras[0].periods).toEqual([]);
		expect(eras[4].periods).toEqual([]);
	});

	it('collects periods without an era and styles without a period', () => {
		const timeline = buildTimeline(index);

		expect(timeline.periodsWithoutEra.map((period) => period.name)).toEqual(['Orphan']);
		expect(timeline.stylesWithoutPeriod.map((style) => style.name)).toEqual(['Loose']);
	});

	it('is empty for an empty collection', () => {
		const timeline = buildTimeline(emptyCardIndex());

		expect(timeline.eras.every((era) => era.periods.length === 0)).toBe(true);
		expect(timeline.periodsWithoutEra).toEqual([]);
		expect(timeline.stylesWithoutPeriod).toEqual([]);
	});

	it('sorts periods and styles by name in Polish order', () => {
		const data = {
			values: [
				{ id: 'p1', category: 'period' as const, name: 'Żeliwo', count: 0 },
				{ id: 'p2', category: 'period' as const, name: 'Zamek', count: 0 },
				{ id: 'p3', category: 'period' as const, name: 'Ząb', count: 0 }
			],
			periodEras: [],
			stylePeriods: []
		};

		expect(buildTimeline(data).periodsWithoutEra.map((period) => period.name)).toEqual([
			'Zamek',
			'Ząb',
			'Żeliwo'
		]);
	});
});

describe('valuesOf', () => {
	it('returns the values of one category sorted by name', () => {
		expect(valuesOf(index, 'material').map((value) => value.name)).toEqual(['Bronze', 'Marble']);
	});
});

describe('links of a value', () => {
	it('lists the eras of a period in the order of the eras', () => {
		expect(erasOfPeriod(index, 'period-classical')).toEqual(['antiquity', 'early_modern']);
		expect(erasOfPeriod(index, 'period-orphan')).toEqual([]);
	});

	it('lists the periods of a style', () => {
		expect(periodsOfStyle(index, 'style-ionic').map((period) => period.name)).toEqual([
			'Classical',
			'Gothic'
		]);
	});

	it('locks the periods that an artwork uses together with the style', () => {
		expect(lockedPeriodIds(index, 'style-ionic')).toEqual(new Map([['period-classical', 1]]));
		expect(lockedPeriodIds(index, 'style-loose')).toEqual(new Map());
	});
});

describe('planNameChange', () => {
	it('asks for a name when the field is empty', () => {
		expect(planNameChange(record('style-doric'), '   ', index)).toEqual({ kind: 'empty' });
	});

	it('reports no change for the same name', () => {
		expect(planNameChange(record('style-doric'), ' Doric ', index)).toEqual({
			kind: 'unchanged'
		});
	});

	it('renames to a new name', () => {
		expect(planNameChange(record('style-doric'), 'Doric order', index)).toEqual({
			kind: 'rename',
			name: 'Doric order'
		});
	});

	it('treats a change of letter case or diacritics of the value itself as a rename', () => {
		expect(planNameChange(record('style-doric'), 'doric', index)).toEqual({
			kind: 'rename',
			name: 'doric'
		});
	});

	it('merges when the name matches another value of the same kind', () => {
		expect(planNameChange(record('style-doric'), 'IONIC', index)).toEqual({
			kind: 'merge',
			target: record('style-ionic')
		});
	});

	it('ignores diacritics when comparing names', () => {
		const data = {
			...index,
			values: [
				...index.values,
				{ id: 'style-gothic', category: 'style' as const, name: 'Gotyk', count: 1 }
			]
		};

		expect(planNameChange(record('style-doric'), 'gótyk', data)).toMatchObject({ kind: 'merge' });
	});

	it('does not merge with a value of another kind', () => {
		expect(planNameChange(record('material-marble'), 'Doric', index)).toEqual({
			kind: 'rename',
			name: 'Doric'
		});
	});
});

describe('planEraMove', () => {
	it('counts the artworks of the removed eras', () => {
		expect(planEraMove(index, 'period-classical', ['early_modern'])).toEqual({
			count: 2,
			removed: ['antiquity'],
			remaining: ['early_modern']
		});
	});

	it('counts nothing when no era is removed', () => {
		expect(planEraMove(index, 'period-classical', ['antiquity', 'early_modern', 'modern'])).toEqual(
			{ count: 0, removed: [], remaining: ['antiquity', 'early_modern', 'modern'] }
		);
	});

	it('leaves no remaining era when all are removed', () => {
		expect(planEraMove(index, 'period-classical', [])).toEqual({
			count: 3,
			removed: ['antiquity', 'early_modern'],
			remaining: []
		});
	});
});

describe('canDelete', () => {
	it('allows deleting only a value no artwork uses', () => {
		expect(canDelete(record('style-loose'))).toBe(true);
		expect(canDelete(record('style-doric'))).toBe(false);
	});
});
