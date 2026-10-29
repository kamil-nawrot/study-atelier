import { m } from '#lib/i18n/i18n.ts';
import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
import type { ImageSearchResult } from '#lib/images/types/image-search-result.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

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
