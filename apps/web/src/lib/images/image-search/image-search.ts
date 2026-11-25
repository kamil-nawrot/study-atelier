import { formatLifeYears, formatYear } from '#lib/catalogue/years/years.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	isConfidentArtwork,
	preferredGroup,
	typeDistance,
	yearDistance,
	type ClassGroups
} from '#lib/images/artwork-confidence/artwork-confidence.ts';
import { resolveClassGroups } from '#lib/images/class-groups/class-groups.ts';
import { commonsThumbnailSrcset, fetchCommonsFiles } from '#lib/images/commons/commons.ts';
import { imageSearchErrorMessage } from '#lib/images/errors/errors.ts';
import type { CandidateImage } from '#lib/images/types/candidate-image.ts';
import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
import type { ImageSearchQuery } from '#lib/images/types/image-search-query.ts';
import type { ImageSearchResult } from '#lib/images/types/image-search-result.ts';
import { searchWikidataArtworks, searchWikidataPeople } from '#lib/images/wikidata/wikidata.ts';
import { withDeadline } from '#lib/images/wikimedia/wikimedia.ts';
import type { SourceDate } from '#lib/images/types/source-date.ts';
import type { WikidataArtwork } from '#lib/images/types/wikidata-artwork.ts';
import type { WikidataPerson } from '#lib/images/types/wikidata-person.ts';

export const CANDIDATE_LIMIT = 8;
export const CANDIDATE_THUMBNAIL_WIDTH = 330;

const CANDIDATE_WIDTHS = [250, 330, 500] as const;
const MIN_SHARED_WORD_LENGTH = 4;
const YEAR_PRECISION = 9;
const DECADE_PRECISION = 8;
const CENTURY_PRECISION = 7;
const LIFE_YEAR_TOLERANCE = 10;
const SAINT_PREFIX = /^(święt[aeiy]j?|św\.|bł\.|błogosławion[aey]j?)\s+/iu;
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

type ArtworkHints = Pick<Extract<ImageSearchQuery, { kind: 'artwork' }>, 'typeCode' | 'year'>;

export function rankArtworks(
	artworks: WikidataArtwork[],
	authors: string[],
	groups: ClassGroups = new Map(),
	hints: ArtworkHints = {}
): WikidataArtwork[] {
	const preferred = preferredGroup(hints.typeCode ?? '');
	const scored = artworks
		.filter((artwork) => isConfidentArtwork(artwork, groups))
		.map((artwork) => ({
			artwork,
			score: matchesAuthor([...artwork.creators, ...artwork.creatorNames], authors)
				? 2
				: artwork.hasCreator
					? 1
					: 0,
			type: typeDistance(artwork, groups, preferred),
			years: yearDistance(artwork, hints.year ?? null)
		}));
	const best = Math.max(0, ...scored.map(({ score }) => score));
	return scored
		.filter(({ score }) => best < 2 || score === 2)
		.sort(
			(first, second) =>
				second.score - first.score || first.type - second.type || first.years - second.years
		)
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

type CommonsFiles = Awaited<ReturnType<typeof fetchCommonsFiles>>;

function candidateImage(file: string, files: CommonsFiles): CandidateImage | null {
	const details = files.get(file);
	if (!details) return null;
	return {
		file,
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
	};
}

function lifeYear(date: SourceDate | null): number | null {
	return date && date.precision >= DECADE_PRECISION ? date.year : null;
}

function lifeYears(person: WikidataPerson): string | undefined {
	const approximate = [person.born, person.died].some(
		(date) => date !== null && date.precision < YEAR_PRECISION
	);
	return formatLifeYears(lifeYear(person.born), lifeYear(person.died), approximate);
}

async function findArtworkCandidates(
	query: Extract<ImageSearchQuery, { kind: 'artwork' }>
): Promise<ImageSearchResult> {
	const found = await searchWikidataArtworks(query.title.trim());
	const [groups, files] = await Promise.all([
		resolveClassGroups(found.flatMap((artwork) => artwork.types)),
		fetchCommonsFiles(
			found.map((artwork) => artwork.file),
			CANDIDATE_THUMBNAIL_WIDTH
		)
	]);
	const artworks = rankArtworks(found, query.authors, groups, query);
	const authorMatch = artworks.some((artwork) =>
		matchesAuthor([...artwork.creators, ...artwork.creatorNames], query.authors)
	);
	const candidates = artworks.flatMap((artwork): ImageCandidate[] => {
		const image = candidateImage(artwork.file, files);
		return image
			? [
					{
						wikidataId: artwork.wikidataId,
						title: artwork.title,
						authors: artwork.creators,
						date: formatSourceDate(artwork.date),
						image
					}
				]
			: [];
	});
	return { candidates, authorMatch };
}

function lifeYearMatches(found: SourceDate | null, typed: number | null | undefined): boolean {
	if (typed === null || typed === undefined || !Number.isFinite(typed) || found === null)
		return true;
	if (found.precision < DECADE_PRECISION) return true;
	return Math.abs(found.year - typed) <= LIFE_YEAR_TOLERANCE;
}

export function matchesLifeYears(
	person: WikidataPerson,
	query: Extract<ImageSearchQuery, { kind: 'person' }>
): boolean {
	return lifeYearMatches(person.born, query.born) && lifeYearMatches(person.died, query.died);
}

export function portraitSearchName(name: string, figure: boolean): string {
	const trimmed = name.trim();
	if (!figure) return trimmed;
	const stripped = trimmed.replace(SAINT_PREFIX, '').trim();
	return stripped === '' ? trimmed : stripped;
}

async function findPortraitCandidates(
	query: Extract<ImageSearchQuery, { kind: 'person' }>
): Promise<ImageCandidate[]> {
	const figure = query.figure ?? false;
	const people = (await searchWikidataPeople(portraitSearchName(query.name, figure), figure))
		.filter((person) => matchesLifeYears(person, query))
		.slice(0, CANDIDATE_LIMIT);
	const files = await fetchCommonsFiles(
		people.map((person) => person.file),
		CANDIDATE_THUMBNAIL_WIDTH
	);
	return people.flatMap((person): ImageCandidate[] => {
		const image = candidateImage(person.file, files);
		return image
			? [
					{
						wikidataId: person.wikidataId,
						title: person.name,
						authors: [],
						date: lifeYears(person),
						image
					}
				]
			: [];
	});
}

export async function findImageCandidates(query: ImageSearchQuery): Promise<ImageSearchResult> {
	try {
		if (query.kind === 'person')
			return { candidates: await withDeadline(findPortraitCandidates(query)) };
		return await withDeadline(findArtworkCandidates(query));
	} catch (error) {
		return { candidates: [], error: imageSearchErrorMessage(error) };
	}
}
