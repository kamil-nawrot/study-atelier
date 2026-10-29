import { afterEach, describe, expect, it, vi } from 'vitest';
import { datesOf, searchEvents } from './wikipedia.ts';
import type { Claims } from '#lib/timeline/types/claims.ts';
import type { TimeStatement } from '#lib/timeline/types/time-statement.ts';

function time(value: string, precision = 9, rank: TimeStatement['rank'] = 'normal'): TimeStatement {
	return { rank, mainsnak: { datavalue: { value: { time: `${value}T00:00:00Z`, precision } } } };
}

function respond(body: unknown): Response {
	return new Response(JSON.stringify(body), { status: 200 });
}

function stub(
	hits: { pageid: number; title: string }[],
	pages: Record<string, unknown>[],
	claims: Record<string, Claims>
): void {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL | Request) => {
			const url = new URL(String(input));
			if (url.hostname === 'www.wikidata.org')
				return respond({
					entities: Object.fromEntries(
						(url.searchParams.get('ids') ?? '')
							.split('|')
							.map((id) => [id, { claims: claims[id] ?? {} }])
					)
				});
			if (url.searchParams.has('srsearch')) return respond({ query: { search: hits } });
			return respond({ query: { pages } });
		})
	);
}

function page(
	pageid: number,
	title: string,
	extract: string,
	item?: string
): Record<string, unknown> {
	return {
		pageid,
		title,
		extract,
		fullurl: `https://pl.wikipedia.org/wiki/${title}`,
		pageprops: item ? { wikibase_item: item } : {}
	};
}

describe('datesOf', () => {
	it('takes a period from its start and end time', () => {
		expect(datesOf({ P580: [time('+1618-01-01')], P582: [time('+1648-01-01')] })).toEqual({
			yearFrom: 1618,
			yearTo: 1648,
			approximate: false
		});
	});

	it('takes a single year from the point in time', () => {
		expect(datesOf({ P585: [time('+0966-04-19', 11)] })).toEqual({
			yearFrom: null,
			yearTo: 966,
			approximate: false
		});
	});

	it('keeps years before the common era as negative years', () => {
		expect(datesOf({ P580: [time('-0431-00-00')], P582: [time('-0404-04-25', 11)] })).toEqual({
			yearFrom: -431,
			yearTo: -404,
			approximate: false
		});
	});

	it('gives one year when the period starts and ends in the same year', () => {
		expect(datesOf({ P580: [time('+1453-04-06', 11)], P582: [time('+1453-05-29', 11)] })).toEqual({
			yearFrom: null,
			yearTo: 1453,
			approximate: false
		});
	});

	it('prefers the period to the point in time', () => {
		expect(
			datesOf({
				P580: [time('+1789-07-14', 11)],
				P582: [time('+1799-11-09', 11)],
				P585: [time('+1789-05-05', 11)]
			})?.yearFrom
		).toBe(1789);
	});

	it('marks a date less precise than a year as approximate', () => {
		expect(datesOf({ P580: [time('+1400-00-00', 7)], P582: [time('+1650-00-00', 7)] })).toEqual({
			yearFrom: 1400,
			yearTo: 1650,
			approximate: true
		});
	});

	it('takes the earliest of several dates and marks it approximate', () => {
		expect(
			datesOf({ P585: [time('-0007-00-00'), time('-0002-00-00'), time('-0005-00-00')] })
		).toEqual({ yearFrom: null, yearTo: -7, approximate: true });
	});

	it('uses the preferred date and leaves out deprecated ones', () => {
		expect(
			datesOf({
				P585: [
					time('+1500-00-00', 9, 'deprecated'),
					time('+1492-10-12', 11, 'preferred'),
					time('+1493-00-00')
				]
			})
		).toEqual({ yearFrom: null, yearTo: 1492, approximate: false });
	});

	it('takes a start or an end alone as a single year', () => {
		expect(datesOf({ P580: [time('+1517-10-31', 11)] })?.yearTo).toBe(1517);
		expect(datesOf({ P582: [time('+1815-00-00')] })?.yearTo).toBe(1815);
	});

	it('falls back to the point in time when the start comes after the end', () => {
		expect(
			datesOf({
				P580: [time('+1700-00-00')],
				P582: [time('+1600-00-00')],
				P585: [time('+1650-00-00')]
			})
		).toEqual({ yearFrom: null, yearTo: 1650, approximate: false });
	});

	it('gives nothing without dates', () => {
		expect(datesOf({})).toBeNull();
		expect(datesOf({ P585: [time('+0000-00-00')] })).toBeNull();
		expect(datesOf({ P580: [time('-13800000000-00-00')] })).toBeNull();
		expect(datesOf({ P585: [time('+3000-00-00')] })).toBeNull();
	});
});

describe('searchEvents', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('gives the articles with dates in the order of the search, with a short description', async () => {
		stub(
			[
				{ pageid: 1, title: 'Bitwa pod Wiedniem' },
				{ pageid: 2, title: 'Wiedeń' },
				{ pageid: 3, title: 'Bitwa pod Humiennem' }
			],
			[
				page(3, 'Bitwa pod Humiennem', 'Bitwa z 1619 roku.', 'Q3'),
				page(1, 'Bitwa pod Wiedniem', `Bitwa z 1683 roku. ${'Dalej. '.repeat(80)}`, 'Q1'),
				page(2, 'Wiedeń', 'Stolica Austrii.', 'Q2')
			],
			{
				Q1: { P585: [time('+1683-09-12', 11)] },
				Q3: { P585: [time('+1619-11-23', 11)] }
			}
		);

		const found = await searchEvents('odsiecz wiedeńska');

		expect(found.map((article) => article.title)).toEqual([
			'Bitwa pod Wiedniem',
			'Bitwa pod Humiennem'
		]);
		expect(found[0].dates).toEqual({ yearFrom: null, yearTo: 1683, approximate: false });
		expect(found[0].extract.length).toBeLessThanOrEqual(300);
	});

	it('gives nothing for an empty name', async () => {
		stub([], [], {});
		expect(await searchEvents('  ')).toEqual([]);
		expect(fetch).not.toHaveBeenCalled();
	});
});
