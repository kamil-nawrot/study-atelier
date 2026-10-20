import { m } from '#lib/i18n/index.ts';
import type { ImageCandidate, ImageSearchResult } from '#lib/images/types.ts';
import type { ArtworkImageInput } from './types.ts';

export const AUTO_MATCH_DELAY_MS = 600;

export function matchPool(result: ImageSearchResult, authorUnknown: boolean): ImageCandidate[] {
	if (result.error !== undefined) return [];
	if (result.authorMatch) return result.candidates;
	return authorUnknown && result.candidates.length === 1 ? result.candidates : [];
}

export function matchKey(title: string, authors: string[]): string {
	return JSON.stringify([title.trim(), authors]);
}

export function matchLabel(candidate: ImageCandidate): string {
	const details = [candidate.title, candidate.authors.join(', '), candidate.date ?? ''];
	return m.artworkForm.matchFound(details.filter((part) => part !== '').join(' · '));
}

export function isCandidateImage(
	image: ArtworkImageInput | null,
	candidate: ImageCandidate | undefined
): boolean {
	return (
		image?.kind === 'commons' &&
		candidate !== undefined &&
		image.wikidataId === candidate.wikidataId &&
		image.file === candidate.image.file
	);
}
