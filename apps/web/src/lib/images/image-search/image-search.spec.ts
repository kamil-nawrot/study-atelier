import { afterEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	CANDIDATE_LIMIT,
	findImageCandidates,
	formatSourceDate,
	matchesAuthor,
	matchesLifeYears,
	portraitSearchName,
	rankArtworks,
	romanNumeral
} from './image-search.ts';
import { forgetClassGroups } from '#lib/images/class-groups/class-groups.ts';
import type { ClassGroup } from '#lib/images/types/class-group.ts';
import type { WikidataArtwork } from '#lib/images/types/wikidata-artwork.ts';
import type { WikidataPerson } from '#lib/images/types/wikidata-person.ts';

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
		types: [],
		inCollection: false,
		isClass: false,
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

describe('rankArtworks with the confidence rule', () => {
	const groups = new Map<string, ClassGroup | null>([
		['Q3305213', 'artwork'],
		['Q2977', 'building'],
		['Q3957', null]
	]);

	it('leaves out a town, a concept and an unknown type, and keeps artworks and buildings', () => {
		const town = artwork({ wikidataId: 'Q2', types: ['Q3957'] });
		const concept = artwork({ wikidataId: 'Q3', types: ['Q2977'], isClass: true });
		const painting = artwork({ wikidataId: 'Q4', types: ['Q3305213'] });
		const cathedral = artwork({ wikidataId: 'Q5', types: ['Q2977'] });

		expect(
			rankArtworks([town, concept, painting, cathedral], [], groups).map(
				({ wikidataId }) => wikidataId
			)
		).toEqual(['Q4', 'Q5']);
	});

	it('puts buildings first for architecture and artworks first for other types', () => {
		const painting = artwork({ wikidataId: 'Q4', types: ['Q3305213'] });
		const cathedral = artwork({ wikidataId: 'Q5', types: ['Q2977'] });
		const ids = (typeCode: 'architecture' | 'painting'): string[] =>
			rankArtworks([painting, cathedral], [], groups, { typeCode }).map(
				({ wikidataId }) => wikidataId
			);

		expect(ids('architecture')).toEqual(['Q5', 'Q4']);
		expect(ids('painting')).toEqual(['Q4', 'Q5']);
	});

	it('puts the artwork closest to the typed year first among equals', () => {
		const late = artwork({
			wikidataId: 'Q6',
			types: ['Q3305213'],
			date: { year: 1890, precision: 9 }
		});
		const early = artwork({
			wikidataId: 'Q7',
			types: ['Q3305213'],
			date: { year: 1530, precision: 9 }
		});
		const undated = artwork({ wikidataId: 'Q8', types: ['Q3305213'] });

		expect(
			rankArtworks([undated, late, early], [], groups, { year: 1540 }).map(
				({ wikidataId }) => wikidataId
			)
		).toEqual(['Q7', 'Q6', 'Q8']);
	});

	it('never lets the type or the year put another author before a matching one', () => {
		const byAuthor = artwork({
			wikidataId: 'Q9',
			types: ['Q2977'],
			creators: ['Rembrandt'],
			hasCreator: true
		});
		const other = artwork({ wikidataId: 'Q10', types: ['Q3305213'], hasCreator: true });

		expect(
			rankArtworks([other, byAuthor], ['Rembrandt'], groups, { typeCode: 'painting' })
		).toEqual([byAuthor]);
	});
});

describe('matchesLifeYears', () => {
	function person(born: number | null, died: number | null): WikidataPerson {
		return {
			wikidataId: 'Q1',
			name: 'Rembrandt',
			born: born === null ? null : { year: born, precision: 9 },
			died: died === null ? null : { year: died, precision: 9 },
			file: 'Rembrandt.jpg'
		};
	}

	it('keeps a person whose years are within ten years of the typed ones', () => {
		expect(
			matchesLifeYears(person(1606, 1669), {
				kind: 'person',
				name: 'Rembrandt',
				born: 1606,
				died: 1669
			})
		).toBe(true);
		expect(
			matchesLifeYears(person(1600, 1669), { kind: 'person', name: 'Rembrandt', born: 1610 })
		).toBe(true);
	});

	it('drops a namesake from another time', () => {
		expect(
			matchesLifeYears(person(1778, 1860), { kind: 'person', name: 'Rembrandt', born: 1606 })
		).toBe(false);
		expect(
			matchesLifeYears(person(1606, 1860), { kind: 'person', name: 'Rembrandt', died: 1669 })
		).toBe(false);
	});

	it('keeps everyone when the years are missing on either side or not a number', () => {
		expect(
			matchesLifeYears(person(null, null), { kind: 'person', name: 'Rembrandt', born: 1606 })
		).toBe(true);
		expect(matchesLifeYears(person(1778, 1860), { kind: 'person', name: 'Rembrandt' })).toBe(true);
		expect(
			matchesLifeYears(person(1778, 1860), { kind: 'person', name: 'Rembrandt', born: Number.NaN })
		).toBe(true);
	});

	it('does not judge by a year known only to the century', () => {
		const vague = { ...person(null, null), born: { year: 1800, precision: 7 } };
		expect(matchesLifeYears(vague, { kind: 'person', name: 'Rembrandt', born: 1606 })).toBe(true);
	});
});

describe('portraitSearchName', () => {
	it('leaves out a saint prefix for a figure', () => {
		expect(portraitSearchName(' Święty Hieronim ', true)).toBe('Hieronim');
		expect(portraitSearchName('św. Hieronim', true)).toBe('Hieronim');
		expect(portraitSearchName('Święta Barbara', true)).toBe('Barbara');
		expect(portraitSearchName('Błogosławiony Fra Angelico', true)).toBe('Fra Angelico');
	});

	it('keeps the name of an author and a name that is only a prefix', () => {
		expect(portraitSearchName('Święty Hieronim', false)).toBe('Święty Hieronim');
		expect(portraitSearchName('Święty', true)).toBe('Święty');
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
		forgetClassGroups();
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
			],
			authorMatch: true
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const commonsUrl = new URL(String(fetchMock.mock.calls[1][0]));
		expect(commonsUrl.searchParams.get('titles')).toBe('File:The Milkmaid.jpg|File:Missing.jpg');
		expect(commonsUrl.searchParams.get('iiurlwidth')).toBe('330');
	});

	it('does not ask Commons when no candidate has an image, and searches further once', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(
			async () => new Response(JSON.stringify({ results: { bindings: [] } }))
		);

		await expect(
			findImageCandidates({ kind: 'artwork', title: 'Nothing', authors: [] })
		).resolves.toEqual({
			candidates: [],
			authorMatch: false,
			further: true
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const further = new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('query');
		expect(further).toContain('wikibase:endpoint "pl.wikipedia.org"');
	});

	it('searches further when the first search finds only items below the confidence rule', async () => {
		vi.stubGlobal('fetch', fetchMock);
		const town = {
			item: { value: 'http://www.wikidata.org/entity/Q1' },
			title: { value: 'Lubeka' },
			file: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Town.jpg' },
			types: { value: 'Q515' }
		};
		const gate = {
			item: { value: 'http://www.wikidata.org/entity/Q321229' },
			title: { value: 'Brama Holsztyńska' },
			file: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Gate.jpg' },
			types: { value: 'Q82117' }
		};
		const sparql = [[town], [gate]];
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				const query = url.searchParams.get('query') ?? '';
				const bindings = query.includes('?cls wdt:P279*') ? [] : (sparql.shift() ?? []);
				return new Response(JSON.stringify({ results: { bindings } }));
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: ['File:Town.jpg', 'File:Gate.jpg'].map((title) => ({
							title,
							imageinfo: [{ thumburl: thumb, width: 100, height: 100, extmetadata: {} }]
						}))
					}
				})
			);
		});

		const result = await findImageCandidates({
			kind: 'artwork',
			title: 'Brama Holsztyńska w Lubece',
			authors: []
		});

		expect(result.candidates.map((candidate) => candidate.wikidataId)).toEqual(['Q321229']);
		expect(result.further).toBe(true);
	});

	it('shows nothing, without an error, when the further search fails', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock
			.mockResolvedValueOnce(new Response(JSON.stringify({ results: { bindings: [] } })))
			.mockResolvedValue(new Response('', { status: 500 }));

		await expect(
			findImageCandidates({ kind: 'artwork', title: 'Nothing', authors: [] })
		).resolves.toEqual({ candidates: [], authorMatch: false, further: true });
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

	it('asks for the classes it does not know and leaves out what is neither an artwork nor a building', async () => {
		vi.stubGlobal('fetch', fetchMock);
		const entity = (id: string): { value: string } => ({
			value: `http://www.wikidata.org/entity/${id}`
		});
		const file = (name: string): { value: string } => ({
			value: `http://commons.wikimedia.org/wiki/Special:FilePath/${name}`
		});
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			const query = url.searchParams.get('query') ?? '';
			if (url.hostname === 'query.wikidata.org' && query.includes('VALUES ?cls')) {
				return new Response(
					JSON.stringify({
						results: { bindings: [{ cls: entity('Q888'), root: entity('Q811979') }] }
					})
				);
			}
			if (url.hostname === 'query.wikidata.org') {
				return new Response(
					JSON.stringify({
						results: {
							bindings: [
								{
									item: entity('Q173532'),
									title: { value: 'Byblos' },
									file: file('Byblos.jpg'),
									types: { value: 'Q888' }
								},
								{
									item: entity('Q7619206'),
									title: { value: 'Byblos' },
									file: file('Town.jpg'),
									types: { value: 'Q3957' }
								}
							]
						}
					})
				);
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: ['Byblos.jpg', 'Town.jpg'].map((name) => ({
							title: `File:${name}`,
							imageinfo: [{ thumburl: thumb, width: 800, height: 600, extmetadata: {} }]
						}))
					}
				})
			);
		});

		const result = await findImageCandidates({ kind: 'artwork', title: 'Byblos', authors: [] });

		expect(result.candidates.map(({ wikidataId }) => wikidataId)).toEqual(['Q173532']);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('looks for a figure among characters without a saint prefix and drops namesakes by their years', async () => {
		vi.stubGlobal('fetch', fetchMock);
		const entity = (id: string): { value: string } => ({
			value: `http://www.wikidata.org/entity/${id}`
		});
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				const query = url.searchParams.get('query') ?? '';
				expect(query).toContain('mwapi:search "Hieronim"');
				expect(query).toContain('?item wdt:P31 ?class.');
				return new Response(
					JSON.stringify({
						results: {
							bindings: [
								{
									item: entity('Q44248'),
									name: { value: 'Hieronim ze Strydonu' },
									file: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Jerome.jpg' },
									born: { value: '0347-01-01T00:00:00Z/9' }
								},
								{
									item: entity('Q2'),
									name: { value: 'Hieronim' },
									file: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Other.jpg' },
									born: { value: '1890-01-01T00:00:00Z/9' }
								}
							]
						}
					})
				);
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: ['Jerome.jpg', 'Other.jpg'].map((name) => ({
							title: `File:${name}`,
							imageinfo: [{ thumburl: thumb, width: 800, height: 600, extmetadata: {} }]
						}))
					}
				})
			);
		});

		const result = await findImageCandidates({
			kind: 'person',
			name: 'Święty Hieronim',
			figure: true,
			born: 347
		});

		expect(result.candidates.map(({ wikidataId }) => wikidataId)).toEqual(['Q44248']);
	});
});
