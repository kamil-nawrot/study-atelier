import { locale } from '#lib/i18n/i18n.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';

import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import type { TitleAndAuthors } from '#lib/artworks/types/title-and-authors.ts';
import type { DuplicateCandidate } from '#lib/artworks/types/duplicate-candidate.ts';

function authorKeys(authors: readonly string[]): string[] {
	return [...new Set(authors.map(valueKey))].sort();
}

export function sameTitleAndAuthors(a: TitleAndAuthors, b: TitleAndAuthors): boolean {
	if (valueKey(a.title) !== valueKey(b.title)) return false;
	const left = authorKeys(a.authors);
	const right = authorKeys(b.authors);
	return left.length === right.length && left.every((key, index) => key === right[index]);
}

export function duplicateNumbers(
	artwork: TitleAndAuthors,
	candidates: readonly DuplicateCandidate[],
	excludeId?: string
): number[] {
	return candidates
		.filter((candidate) => candidate.id !== excludeId && sameTitleAndAuthors(artwork, candidate))
		.map((candidate) => candidate.number)
		.sort((a, b) => a - b);
}

export function formatRecordNumbers(numbers: readonly number[]): string {
	return new Intl.ListFormat(locale, { type: 'conjunction' }).format(
		numbers.map(formatRecordNumber)
	);
}
