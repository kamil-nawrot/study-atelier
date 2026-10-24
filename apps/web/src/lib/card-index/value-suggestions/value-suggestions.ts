import { locale } from '#lib/i18n/index.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { StarterValue, ValueSuggestion } from '#lib/collection/types.ts';

export type SuggestionSource = {
	query: string;
	existing: readonly string[];
	selected: readonly string[];
	starter?: readonly StarterValue[];
	notes?: Readonly<Record<string, string>>;
};

export const STARTER_MIN_QUERY = 2;
export const STARTER_LIMIT = 6;

export function valueKey(name: string): string {
	return normalizeForSearch(name).replace(/\s+/g, ' ');
}

export function editDistance(a: string, b: string): number {
	const rows = Array.from({ length: a.length + 1 }, (_, i) =>
		Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
	);
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
			}
		}
	}
	return rows[a.length][b.length];
}

export function allowedTypos(key: string): number {
	if (key.length < 4) return 0;
	return key.length < 9 ? 1 : 2;
}

export function findSameValue(name: string, existing: readonly string[]): string | undefined {
	const key = valueKey(name);
	return key ? existing.find((value) => valueKey(value) === key) : undefined;
}

export function findSimilarValue(name: string, existing: readonly string[]): string | undefined {
	const key = valueKey(name);
	const limit = allowedTypos(key);
	if (limit === 0) return undefined;
	let closest: { value: string; distance: number } | undefined;
	for (const value of existing) {
		const distance = editDistance(key, valueKey(value));
		if (distance > 0 && distance <= limit && (!closest || distance < closest.distance)) {
			closest = { value, distance };
		}
	}
	return closest?.value;
}

function matching(values: readonly string[], key: string): string[] {
	const ordered = values
		.filter((value) => valueKey(value).includes(key))
		.sort((a, b) => a.localeCompare(b, locale));
	return [
		...ordered.filter((value) => valueKey(value).startsWith(key)),
		...ordered.filter((value) => !valueKey(value).startsWith(key))
	];
}

function matchingStarter(
	starter: readonly StarterValue[],
	key: string,
	known: ReadonlySet<string>
): StarterValue[] {
	if (key.length < STARTER_MIN_QUERY) return [];
	const found = starter.filter(
		(value) =>
			![value.name, ...value.aliases].some((text) => known.has(valueKey(text))) &&
			[value.name, ...value.aliases].some((text) => valueKey(text).includes(key))
	);
	const rank = (value: StarterValue): number =>
		valueKey(value.name).startsWith(key)
			? 0
			: [value.name, ...value.aliases].some((text) => valueKey(text).startsWith(key))
				? 1
				: 2;
	return found
		.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, locale))
		.slice(0, STARTER_LIMIT);
}

function noteOf(
	notes: Readonly<Record<string, string>> | undefined,
	name: string
): { note: string } | Record<string, never> {
	const note = notes?.[valueKey(name)];
	return note ? { note } : {};
}

export function suggestValues(source: SuggestionSource): ValueSuggestion[] {
	const name = source.query.trim();
	const key = valueKey(name);
	const taken = new Set(source.selected.map(valueKey));
	const isFree = (value: string): boolean => !taken.has(valueKey(value));

	const existing = source.existing.filter(isFree);

	const existingMatches = matching(existing, key);
	const known = new Set([...source.existing, ...source.selected].map(valueKey));
	const starterMatches = matchingStarter(source.starter ?? [], key, known);
	const isListed = (source.starter ?? []).some((value) => valueKey(value.name) === key);
	const canCreate =
		key !== '' &&
		!taken.has(key) &&
		!findSameValue(name, source.existing) &&
		!existingMatches.includes(name) &&
		!isListed;
	const similar = canCreate
		? findSimilarValue(
				name,
				existing.filter((value) => !existingMatches.includes(value))
			)
		: undefined;

	return [
		...(similar ? [{ kind: 'similar' as const, name: similar }] : []),
		...existingMatches.map((value) => ({
			kind: 'existing' as const,
			name: value,
			...noteOf(source.notes, value)
		})),
		...starterMatches.map((value) => ({
			kind: 'starter' as const,
			name: value.name,
			note: value.note
		})),
		...(canCreate ? [{ kind: 'new' as const, name }] : [])
	];
}
