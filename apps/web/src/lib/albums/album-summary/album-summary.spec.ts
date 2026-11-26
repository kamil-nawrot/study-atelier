import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	albumCounts,
	albumsByEra,
	artworkDate,
	authorNames,
	coverImages
} from './album-summary.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

function artwork(id: string, extra: Partial<AlbumArtwork> = {}): AlbumArtwork {
	return {
		id,
		revision: 1,
		wikidataId: null,
		typeCode: null,
		eraCode: null,
		yearFrom: null,
		yearTo: null,
		yearApproximate: false,
		valueIds: [],
		termIds: [],
		eventIds: [],
		images: [
			{
				path: `a/images/${id}.webp`,
				width: 3,
				height: 4,
				licence: 'CC0',
				licenceUrl: null,
				attribution: null
			}
		],
		title: id,
		alternativeTitles: [],
		description: null,
		...extra
	};
}

function album(
	slug: string,
	title: string,
	eraCode: EraCode,
	artworks: AlbumArtwork[] = []
): Album {
	return {
		slug,
		language: 'pl',
		eraCode,
		title,
		description: '',
		artworks,
		values: [],
		terms: [],
		events: []
	};
}

describe('album summary', () => {
	it('counts the artworks, glossary entries and events', () => {
		const counted = {
			...album('a', 'A', 'prehistory', [artwork('x'), artwork('y')]),
			terms: [{} as never, {} as never],
			events: [{} as never]
		};

		expect(albumCounts(counted)).toEqual({ artworks: 2, terms: 2, events: 1 });
		expect(m.albums.counts(13, 4, 2)).toBe('13 dzieł · 4 pojęcia · 2 wydarzenia');
		expect(m.albums.counts(1, 0, 5)).toBe('1 dzieło · 5 wydarzeń');
	});

	it('covers an album with the first image of its first four artworks', () => {
		const covered = album(
			'a',
			'A',
			'prehistory',
			['a', 'b', 'c', 'd', 'e'].map((id) => artwork(id))
		);

		expect(coverImages(covered).map((image) => image.path)).toEqual([
			'a/images/a.webp',
			'a/images/b.webp',
			'a/images/c.webp',
			'a/images/d.webp'
		]);
	});

	it('names the authors of an artwork from the album values', () => {
		const named = {
			...album('a', 'A', 'prehistory'),
			values: [
				{ id: 'painter', category: 'author', name: 'Painter' },
				{ id: 'oil', category: 'material', name: 'Oil' }
			] as never
		};

		expect(authorNames(named, artwork('x', { valueIds: ['oil', 'painter'] }))).toEqual(['Painter']);
	});

	it('dates an artwork like the wall does', () => {
		expect(artworkDate(artwork('x', { yearTo: 1503, yearApproximate: true }))).toBe(
			m.atelier.year(1503, true)
		);
		expect(artworkDate(artwork('y'))).toBeUndefined();
	});

	it('groups albums by era in the order of eras and by title within one', () => {
		const listed = [
			album('c', 'Cave paintings', 'prehistory'),
			album('r', 'Rome', 'antiquity'),
			album('v', 'Ancient Venuses', 'prehistory')
		].map((each) => ({ album: each, owned: 0 }));

		expect(
			albumsByEra(listed).map((era) => [era.code, era.albums.map((each) => each.album.slug)])
		).toEqual([
			['prehistory', ['v', 'c']],
			['antiquity', ['r']]
		]);
	});

	it('says how many of an album the atelier holds in the right form', () => {
		expect(m.albums.owned(1, 13)).toBe('1 z 13 jest w Twoim atelier');
		expect(m.albums.owned(3, 13)).toBe('3 z 13 są w Twoim atelier');
		expect(m.albums.owned(5, 13)).toBe('5 z 13 jest w Twoim atelier');
		expect(m.albums.add(1)).toBe('Dodaj 1 dzieło');
		expect(m.albums.add(11)).toBe('Dodaj 11 dzieł');
	});
});
