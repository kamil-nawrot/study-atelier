import { afterEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import {
	CANDIDATE_LIMIT,
	findImageCandidates,
	formatSourceDate,
	matchesAuthor,
	rankArtworks,
	romanNumeral
} from './image-search.ts';
import type { WikidataArtwork } from './wikidata.ts';

const fetchMock = vi.fn<typeof fetch>();

function artwork(overrides: Partial<WikidataArtwork>): WikidataArtwork {
	return {
		wikidataId: 'Q1',
		title: 'The Milkmaid',
		creators: [],
		creatorNames: [],
		hasCreator: false,
		date: null,
		file: 'The Milkmaid.jpg',
		...overrides
	};
}

describe('matchesAuthor', () => {
	it('ignores letter case and diacritics', () => {
		expect(matchesAuthor(['Michał Anioł'], ['michal aniol'])).toBe(true);
	});

	it('accepts a part of the name and a shared surname', () => {
		expect(matchesAuthor(['Johannes Vermeer'], ['Vermeer'])).toBe(true);
		expect(matchesAuthor(['Johannes Vermeer'], ['Jan Vermeer'])).toBe(true);
	});

	it('does not match short shared words or other people', () => {
		expect(matchesAuthor(['Jan Matejko'], ['Jan Steen'])).toBe(false);
		expect(matchesAuthor([], ['Jan Steen'])).toBe(false);
		expect(matchesAuthor(['Jan Steen'], [])).toBe(false);
	});
});

describe('rankArtworks', () => {
	it('keeps only the artworks by the author when there are any', () => {
		const statue = artwork({ wikidataId: 'Q2', creators: ['Michał Anioł'], hasCreator: true });
		const king = artwork({ wikidataId: 'Q3' });

		expect(rankArtworks([king, statue], ['Michelangelo', 'Michał Anioł'])).toEqual([statue]);
	});

	it('matches the author by any of the creator names', () => {
		const statue = artwork({
			wikidataId: 'Q2',
			creators: ['Michał Anioł'],
			creatorNames: ['Michelangelo'],
			hasCreator: true
		});

		expect(rankArtworks([artwork({}), statue], ['Michelangelo'])).toEqual([statue]);
	});

	it('puts artworks with a creator first when the author matches none', () => {
		const person = artwork({ wikidataId: 'Q2' });
		const work = artwork({ wikidataId: 'Q3', hasCreator: true });

		expect(rankArtworks([person, work], []).map(({ wikidataId }) => wikidataId)).toEqual([
			'Q3',
			'Q2'
		]);
	});

	it('shows a short list', () => {
		const many = Array.from({ length: 20 }, (_, index) => artwork({ wikidataId: `Q${index}` }));

		expect(rankArtworks(many, [])).toHaveLength(CANDIDATE_LIMIT);
	});
});

describe('formatSourceDate', () => {
	it('shows a year as a year', () => {
		expect(formatSourceDate({ year: 1658, precision: 9 })).toBe('1658');
		expect(formatSourceDate({ year: 1658, precision: 11 })).toBe('1658');
	});

	it('marks a decade as approximate', () => {
		expect(formatSourceDate({ year: 1500, precision: 8 })).toBe(m.atelier.year(1500, true));
	});

	it('shows a century in Roman numerals', () => {
		expect(formatSourceDate({ year: 1600, precision: 7 })).toBe(
			m.imageSearch.century('XVI', false)
		);
		expect(formatSourceDate({ year: -141, precision: 7 })).toBe(m.imageSearch.century('II', true));
	});

	it('leaves out vaguer dates', () => {
		expect(formatSourceDate({ year: -3000, precision: 6 })).toBeUndefined();
		expect(formatSourceDate(null)).toBeUndefined();
	});
});

describe('romanNumeral', () => {
	it('writes centuries in Roman numerals', () => {
		expect([1, 4, 9, 14, 19, 21].map(romanNumeral)).toEqual(['I', 'IV', 'IX', 'XIV', 'XIX', 'XXI']);
	});
});

describe('findImageCandidates', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	const thumb =
		'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/The_Milkmaid.jpg/330px-The_Milkmaid.jpg';

	function respond(): void {
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				return new Response(
					JSON.stringify({
						results: {
							bindings: [
								{
									item: { value: 'http://www.wikidata.org/entity/Q167605' },
									title: { value: 'The Milkmaid' },
									file: {
										value: 'http://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg'
									},
									date: { value: '1658-01-01T00:00:00Z/9' },
									creators: { value: 'Johannes Vermeer' },
									creatorNames: { value: 'Johannes Vermeer' },
									creatorCount: { value: '1' }
								},
								{
									item: { value: 'http://www.wikidata.org/entity/Q99' },
									title: { value: 'The Milkmaid' },
									file: {
										value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Missing.jpg'
									},
									creators: { value: 'Johannes Vermeer' },
									creatorNames: { value: 'Johannes Vermeer' },
									creatorCount: { value: '1' }
								}
							]
						}
					})
				);
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: [
							{
								title: 'File:The Milkmaid.jpg',
								imageinfo: [
									{
										thumburl: thumb,
										width: 2000,
										height: 2250,
										extmetadata: {
											LicenseShortName: { value: 'Public domain' },
											Artist: { value: '<a href="https://example.org">Johannes Vermeer</a>' }
										}
									}
								]
							},
							{ title: 'File:Missing.jpg', missing: true }
						]
					}
				})
			);
		});
	}

	it('returns candidates with Commons thumbnails, sizes and licences and leaves out a file Commons does not return', async () => {
		vi.stubGlobal('fetch', fetchMock);
		respond();

		const result = await findImageCandidates({
			kind: 'artwork',
			title: 'The Milkmaid',
			authors: ['Johannes Vermeer']
		});

		expect(result).toEqual({
			candidates: [
				{
					wikidataId: 'Q167605',
					title: 'The Milkmaid',
					authors: ['Johannes Vermeer'],
					date: '1658',
					image: {
						file: 'The Milkmaid.jpg',
						src: thumb,
						srcset: `${thumb.replace('/330px-', '/250px-')} 250w, ${thumb} 330w, ${thumb.replace('/330px-', '/500px-')} 500w`,
						width: 2000,
						height: 2250,
						licence: 'Public domain',
						licenceUrl: null,
						attribution: 'Johannes Vermeer'
					}
				}
			]
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const commonsUrl = new URL(String(fetchMock.mock.calls[1][0]));
		expect(commonsUrl.searchParams.get('titles')).toBe('File:The Milkmaid.jpg|File:Missing.jpg');
		expect(commonsUrl.searchParams.get('iiurlwidth')).toBe('330');
	});

	it('does not ask Commons when no candidate has an image', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: { bindings: [] } })));

		await expect(
			findImageCandidates({ kind: 'artwork', title: 'Nothing', authors: [] })
		).resolves.toEqual({
			candidates: []
		});
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('gives a calm message when the service keeps limiting requests', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('', { status: 429 }));

		const result = findImageCandidates({ kind: 'artwork', title: 'The Milkmaid', authors: [] });
		await vi.runAllTimersAsync();

		await expect(result).resolves.toEqual({
			candidates: [],
			error: m.imageSearchErrors.rateLimited
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('finds portraits of people and leaves out those whose file Commons does not have', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				expect(url.searchParams.get('query')).toContain('wd:Q5');
				return new Response(
					JSON.stringify({
						results: {
							bindings: [
								{
									item: { value: 'http://www.wikidata.org/entity/Q41264' },
									name: { value: 'Johannes Vermeer' },
									file: {
										value: 'http://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg'
									},
									born: { value: '1632-10-31T00:00:00Z/11' },
									died: { value: '1675-12-15T00:00:00Z/11' }
								},
								{
									item: { value: 'http://www.wikidata.org/entity/Q99' },
									name: { value: 'Jan Vermeer' },
									file: {
										value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Missing.jpg'
									},
									born: { value: '1600-01-01T00:00:00Z/8' }
								}
							]
						}
					})
				);
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: [
							{
								title: 'File:The Milkmaid.jpg',
								imageinfo: [
									{
										thumburl: thumb,
										width: 2000,
										height: 2250,
										extmetadata: { LicenseShortName: { value: 'Public domain' } }
									}
								]
							},
							{ title: 'File:Missing.jpg', missing: true }
						]
					}
				})
			);
		});

		const result = await findImageCandidates({ kind: 'person', name: ' Vermeer ' });

		expect(result.candidates).toHaveLength(1);
		expect(result.candidates[0]).toMatchObject({
			wikidataId: 'Q41264',
			title: 'Johannes Vermeer',
			authors: [],
			date: '1632–1675',
			image: { file: 'The Milkmaid.jpg', width: 2000, height: 2250 }
		});
	});
});
