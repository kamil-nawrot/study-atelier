import { formatYear } from '#lib/collection/format.ts';
import { normalizeForSearch } from '#lib/collection/search.ts';
import { m } from '#lib/i18n/index.ts';
import { commonsThumbnailSrcset, fetchCommonsFiles } from './commons.ts';
import { imageSearchErrorMessage } from './errors.ts';
import type { ImageCandidate, ImageSearchResult } from './types.ts';
import { searchWikidataArtworks, type SourceDate, type WikidataArtwork } from './wikidata.ts';

export const CANDIDATE_LIMIT = 8;
export const CANDIDATE_THUMBNAIL_WIDTH = 330;

const CANDIDATE_WIDTHS = [250, 330, 500] as const;
const MIN_SHARED_WORD_LENGTH = 4;
const YEAR_PRECISION = 9;
const DECADE_PRECISION = 8;
const CENTURY_PRECISION = 7;
const ROMAN_NUMERALS: [number, string][] = [
	[1000, 'M'],
	[900, 'CM'],
	[500, 'D'],
	[400, 'CD'],
	[100, 'C'],
	[90, 'XC'],
	[50, 'L'],
	[40, 'XL'],
	[10, 'X'],
	[9, 'IX'],
	[5, 'V'],
	[4, 'IV'],
	[1, 'I']
];

export type ImageSearchQuery = {
	title: string;
	authors: string[];
};

function normalizeName(name: string): string {
	return normalizeForSearch(name)
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

function namesMatch(first: string, second: string): boolean {
	if (first === '' || second === '') return false;
	if (first.includes(second) || second.includes(first)) return true;
	const words = new Set(first.split(' ').filter((word) => word.length >= MIN_SHARED_WORD_LENGTH));
	return second.split(' ').some((word) => words.has(word));
}

export function matchesAuthor(creatorNames: string[], authors: string[]): boolean {
	const creators = creatorNames.map(normalizeName);
	return authors
		.map(normalizeName)
		.some((author) => creators.some((creator) => namesMatch(creator, author)));
}

export function rankArtworks(artworks: WikidataArtwork[], authors: string[]): WikidataArtwork[] {
	const scored = artworks.map((artwork) => ({
		artwork,
		score: matchesAuthor([...artwork.creators, ...artwork.creatorNames], authors)
			? 2
			: artwork.hasCreator
				? 1
				: 0
	}));
	const best = Math.max(0, ...scored.map(({ score }) => score));
	return scored
		.filter(({ score }) => best < 2 || score === 2)
		.sort((first, second) => second.score - first.score)
		.slice(0, CANDIDATE_LIMIT)
		.map(({ artwork }) => artwork);
}

export function romanNumeral(value: number): string {
	let rest = value;
	let numeral = '';
	for (const [amount, letters] of ROMAN_NUMERALS) {
		while (rest >= amount) {
			numeral += letters;
			rest -= amount;
		}
	}
	return numeral;
}

export function formatSourceDate(date: SourceDate | null): string | undefined {
	if (!date) return undefined;
	if (date.precision >= YEAR_PRECISION) return formatYear(date.year, false);
	if (date.precision === DECADE_PRECISION) return formatYear(date.year, true);
	if (date.precision === CENTURY_PRECISION) {
		const century = Math.ceil(Math.abs(date.year) / 100);
		return m.imageSearch.century(romanNumeral(century), date.year < 0);
	}
	return undefined;
}

export async function findImageCandidates(query: ImageSearchQuery): Promise<ImageSearchResult> {
	try {
		const artworks = rankArtworks(await searchWikidataArtworks(query.title), query.authors);
		const files = await fetchCommonsFiles(
			artworks.flatMap((artwork) => artwork.file ?? []),
			CANDIDATE_THUMBNAIL_WIDTH
		);
		const candidates = artworks.map((artwork): ImageCandidate => {
			const details = artwork.file ? files.get(artwork.file) : undefined;
			return {
				wikidataId: artwork.wikidataId,
				title: artwork.title,
				authors: artwork.creators,
				date: formatSourceDate(artwork.date),
				image:
					artwork.file && details
						? {
								file: artwork.file,
								src: details.thumbnailUrl,
								srcset: commonsThumbnailSrcset(
									details.thumbnailUrl,
									CANDIDATE_THUMBNAIL_WIDTH,
									CANDIDATE_WIDTHS.filter((width) => width <= details.width)
								),
								width: details.width,
								height: details.height,
								licence: details.licence,
								licenceUrl: details.licenceUrl,
								attribution: details.attribution
							}
						: null
			};
		});
		return { candidates };
	} catch (error) {
		return { candidates: [], error: imageSearchErrorMessage(error) };
	}
}
