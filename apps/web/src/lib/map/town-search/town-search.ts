import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { Town } from '#lib/map/types/town.ts';

const SUGGESTIONS = 8;
const WORD_BREAK = /[\s\-'’.()]+/;
const collator = new Intl.Collator('pl');

function rank(name: string, query: string): number | null {
	const normalized = normalizeForSearch(name);
	if (normalized === query) return 0;
	if (normalized.startsWith(query)) return 1;
	if (normalized.split(WORD_BREAK).some((word) => word.startsWith(query))) return 2;
	if (normalized.includes(query)) return 3;
	return null;
}

function bestRank(town: Town, query: string): number | null {
	const ranks = [town.name, ...(town.otherNames ?? [])]
		.map((name) => rank(name, query))
		.filter((value): value is number => value !== null);
	return ranks.length > 0 ? Math.min(...ranks) : null;
}

export function searchTowns(query: string, towns: readonly Town[], limit = SUGGESTIONS): Town[] {
	const normalized = normalizeForSearch(query);
	if (!normalized) return [];
	return towns
		.map((town) => ({ town, rank: bestRank(town, normalized) }))
		.filter((match): match is { town: Town; rank: number } => match.rank !== null)
		.sort(
			(first, second) =>
				first.rank - second.rank || collator.compare(first.town.name, second.town.name)
		)
		.slice(0, limit)
		.map((match) => match.town);
}

export function namesakeRegion(town: Town, shown: readonly Town[]): string | null {
	const namesake = shown.some(
		(other) => other !== town && other.countryCode === town.countryCode && other.name === town.name
	);
	return namesake ? (town.region ?? null) : null;
}
