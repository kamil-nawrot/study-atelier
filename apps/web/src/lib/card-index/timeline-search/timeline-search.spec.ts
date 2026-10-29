import { describe, expect, it } from 'vitest';
import type { CardIndexTimeline } from '#lib/card-index/types/card-index-timeline.ts';
import { narrowTimeline } from './timeline-search.ts';

const timeline: CardIndexTimeline = {
	eras: [
		{
			code: 'middle_ages',
			periods: [
				{
					id: 'p-gothic',
					name: 'Gotyk',
					count: 3,
					styles: [
						{ id: 's-rayonnant', name: 'Gotyk promienisty', count: 1 },
						{ id: 's-flamboyant', name: 'Gotyk płomienisty', count: 2 }
					]
				},
				{ id: 'p-romanesque', name: 'Romanizm', count: 5, styles: [] }
			]
		},
		{ code: 'antiquity', periods: [{ id: 'p-classical', name: 'Klasycyzm', count: 1, styles: [] }] }
	],
	periodsWithoutEra: [],
	stylesWithoutPeriod: [{ id: 's-loose', name: 'Płomienisty bez okresu', count: 1 }]
};

function names(result: CardIndexTimeline): string[] {
	return [
		...result.eras.flatMap((era) =>
			era.periods.flatMap((period) => [period.name, ...period.styles.map((style) => style.name)])
		),
		...result.stylesWithoutPeriod.map((style) => style.name)
	];
}

describe('narrowTimeline', () => {
	it('keeps everything without a query and sorts each level by name', () => {
		expect(names(narrowTimeline(timeline, '', 'name'))).toEqual([
			'Gotyk',
			'Gotyk płomienisty',
			'Gotyk promienisty',
			'Romanizm',
			'Klasycyzm',
			'Płomienisty bez okresu'
		]);
	});

	it('keeps a matching style under its period and era, and drops eras without matches', () => {
		const result = narrowTimeline(timeline, 'plomien', 'name');

		expect(result.eras.map((era) => era.code)).toEqual(['middle_ages']);
		expect(names(result)).toEqual(['Gotyk', 'Gotyk płomienisty', 'Płomienisty bez okresu']);
	});

	it('keeps a whole era whose name matches', () => {
		const result = narrowTimeline(timeline, 'średnio', 'name');

		expect(result.eras.map((era) => era.code)).toEqual(['middle_ages']);
		expect(names(result)).toEqual(['Gotyk', 'Gotyk płomienisty', 'Gotyk promienisty', 'Romanizm']);
	});

	it('keeps all styles of a matching period', () => {
		expect(names(narrowTimeline(timeline, 'romanizm', 'name'))).toEqual(['Romanizm']);
		expect(names(narrowTimeline(timeline, 'gotyk', 'name'))).toEqual([
			'Gotyk',
			'Gotyk płomienisty',
			'Gotyk promienisty'
		]);
	});

	it('sorts periods and styles by the number of artworks and keeps the eras in order', () => {
		const result = narrowTimeline(timeline, '', 'count');

		expect(result.eras.map((era) => era.code)).toEqual(['middle_ages', 'antiquity']);
		expect(names(result).slice(0, 4)).toEqual([
			'Romanizm',
			'Gotyk',
			'Gotyk płomienisty',
			'Gotyk promienisty'
		]);
	});
});
