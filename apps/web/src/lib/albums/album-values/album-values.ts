import { locale } from '#lib/i18n/i18n.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import type { LearnerValue } from '#lib/albums/types/learner-value.ts';
import type { MatchedValue } from '#lib/albums/types/matched-value.ts';

export function sameName(first: string, second: string): boolean {
	return first.trim().toLocaleLowerCase(locale) === second.trim().toLocaleLowerCase(locale);
}

export function albumValueNames(value: Pick<AlbumValue, 'name' | 'alternativeNames'>): string[] {
	return [value.name, ...value.alternativeNames];
}

function learnerMatch(
	value: AlbumValue,
	learner: readonly LearnerValue[]
): LearnerValue | undefined {
	const own = learner.filter((candidate) => candidate.category === value.category);
	return (
		(value.wikidataId === null
			? undefined
			: own.find((candidate) => candidate.wikidataId === value.wikidataId)) ??
		own.find((candidate) => sameName(candidate.name, value.name)) ??
		own.find((candidate) =>
			value.alternativeNames.some((alternative) => sameName(candidate.name, alternative))
		)
	);
}

export function matchAlbumValue(value: AlbumValue, learner: readonly LearnerValue[]): MatchedValue {
	const match = learnerMatch(value, learner);
	return match ? { name: match.name, isNew: false } : { name: value.name, isNew: true };
}
