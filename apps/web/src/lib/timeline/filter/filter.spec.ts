import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	MAX_LANES,
	applyTimelineFilter,
	artworksIn,
	emptyTimelineFilter,
	forOtherEra,
	isEmptyTimelineFilter,
	laneOptions,
	lanesFull,
	lanesOf,
	removeTimelineTag,
	tagLane,
	timelineFavouriteCount,
	timelineTags,
	toggleAuthor,
	toggleLane,
	toggleTimelineFavourites,
	valueOptions
} from './filter.ts';
import { spanOfYears } from '#lib/timeline/time/time.ts';

const nightWatch = testArtwork(1, 'Straż nocna', {
	authors: ['Rembrandt'],
	period: 'Barok',
	styles: ['Tenebryzm'],
	typeCode: 'painting',
	yearTo: 1642,
	favourite: true
});
const teresa = testArtwork(2, 'Ekstaza św. Teresy', {
	authors: ['Bernini'],
	period: 'Barok',
	typeCode: 'sculpture',
	yearFrom: 1647,
	yearTo: 1652
});
const calling = testArtwork(3, 'Powołanie św. Mateusza', {
	authors: ['Caravaggio'],
	period: 'Barok',
	styles: ['Tenebryzm'],
	typeCode: 'painting',
	yearTo: 1600
});
const venus = testArtwork(4, 'Narodziny Wenus', {
	authors: ['Botticelli'],
	period: 'Renesans',
	typeCode: 'painting',
	yearTo: 1485
});
const artworks = [nightWatch, teresa, calling, venus];

const baroque = { field: 'periods', value: 'Barok' } as const;
const tenebrism = { field: 'styles', value: 'Tenebryzm' } as const;

describe('timeline filter', () => {
	it('starts empty and shows every artwork', () => {
		const filter = emptyTimelineFilter();
		expect(isEmptyTimelineFilter(filter)).toBe(true);
		expect(applyTimelineFilter(artworks, filter)).toEqual(artworks);
	});

	it('shows the artworks of any chosen lane', () => {
		const filter = toggleLane(toggleLane(emptyTimelineFilter(), tenebrism), {
			field: 'periods',
			value: 'Renesans'
		});
		expect(applyTimelineFilter(artworks, filter)).toEqual([nightWatch, calling, venus]);
		expect(lanesOf(nightWatch, filter)).toEqual([0]);
		expect(lanesOf(venus, filter)).toEqual([1]);
	});

	it('puts an artwork in every lane it belongs to', () => {
		const filter = toggleLane(toggleLane(emptyTimelineFilter(), baroque), tenebrism);
		expect(lanesOf(nightWatch, filter)).toEqual([0, 1]);
		expect(lanesOf(teresa, filter)).toEqual([0]);
	});

	it('removes a chosen lane on a second toggle', () => {
		const filter = toggleLane(toggleLane(emptyTimelineFilter(), baroque), baroque);
		expect(filter.lanes).toEqual([]);
	});

	it('takes at most five periods and styles together', () => {
		let filter = emptyTimelineFilter();
		for (let index = 0; index < MAX_LANES + 1; index++)
			filter = toggleLane(filter, { field: index % 2 ? 'styles' : 'periods', value: `V${index}` });
		expect(filter.lanes).toHaveLength(MAX_LANES);
		expect(lanesFull(filter)).toBe(true);
		expect(toggleLane(filter, filter.lanes[0]).lanes).toHaveLength(MAX_LANES - 1);
	});

	it('combines lanes with the type, the author and favourites', () => {
		let filter = toggleLane(emptyTimelineFilter(), baroque);
		filter = { ...filter, types: ['painting'] };
		expect(applyTimelineFilter(artworks, filter)).toEqual([nightWatch, calling]);
		expect(applyTimelineFilter(artworks, toggleAuthor(filter, 'Caravaggio'))).toEqual([calling]);
		expect(applyTimelineFilter(artworks, toggleTimelineFavourites(filter))).toEqual([nightWatch]);
	});

	it('counts lane values among the artworks of the other filters', () => {
		const filter = { ...emptyTimelineFilter(), types: ['painting' as const] };
		expect(laneOptions(artworks, filter, 'periods')).toEqual([
			{ value: 'Barok', count: 2 },
			{ value: 'Renesans', count: 1 }
		]);
		expect(laneOptions(artworks, filter, 'styles')).toEqual([{ value: 'Tenebryzm', count: 2 }]);
	});

	it('keeps a chosen lane value among the options', () => {
		const filter = toggleLane(emptyTimelineFilter(), { field: 'styles', value: 'Rokoko' });
		expect(laneOptions(artworks, filter, 'styles')).toContainEqual({ value: 'Rokoko', count: 0 });
	});

	it('counts types, authors and favourites within the chosen lanes', () => {
		const filter = toggleLane(emptyTimelineFilter(), tenebrism);
		expect(valueOptions(artworks, filter, 'types')).toEqual([{ value: 'painting', count: 2 }]);
		expect(valueOptions(artworks, filter, 'authors').map((option) => option.value)).toEqual([
			'Caravaggio',
			'Rembrandt'
		]);
		expect(timelineFavouriteCount(artworks, filter)).toBe(1);
	});

	it('lists lanes first in the tags and removes them by tag', () => {
		const filter = toggleAuthor(toggleLane(emptyTimelineFilter(), tenebrism), 'Caravaggio');
		const tags = timelineTags(filter);
		expect(tags.map((tag) => tag.id)).toEqual(['styles:Tenebryzm', 'authors:Caravaggio']);
		expect(tagLane(filter, tags[0])).toBe(0);
		expect(tagLane(filter, tags[1])).toBe(-1);
		expect(removeTimelineTag(filter, tags[0]).lanes).toEqual([]);
		expect(removeTimelineTag(filter, tags[1]).authors).toEqual([]);
	});

	it('clears only the lanes in another era', () => {
		const filter = toggleTimelineFavourites(toggleLane(emptyTimelineFilter(), baroque));
		expect(forOtherEra(filter)).toEqual({ ...emptyTimelineFilter(), favourites: true });
	});

	it('finds the artworks that overlap a span of time', () => {
		expect(artworksIn(artworks, spanOfYears(1645, 1650))).toEqual([teresa]);
		expect(
			artworksIn([testArtwork(5, 'Bez daty', { yearTo: null })], spanOfYears(1, 2000))
		).toEqual([]);
	});
});
