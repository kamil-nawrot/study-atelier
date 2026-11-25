import { fetchCategoryFiles } from '#lib/images/commons/commons.ts';
import {
	CANDIDATE_THUMBNAIL_WIDTH,
	toCandidateImage
} from '#lib/images/image-candidate/image-candidate.ts';
import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
import { fetchCommonsCategory } from '#lib/images/wikidata/wikidata.ts';
import { withDeadline } from '#lib/images/wikimedia/wikimedia.ts';

export type SameArtworkSource = {
	wikidataId: string;
	file: string;
	title: string;
	authors: string[];
};

export type SameArtworkCursor = { category: string; next: string };

export type SameArtworkPage = { candidates: ImageCandidate[]; cursor: SameArtworkCursor | null };

function sameFile(first: string, second: string): boolean {
	const normal = (name: string): string => name.replaceAll('_', ' ').trim();
	return normal(first) === normal(second);
}

export async function findSameArtworkImages(
	source: SameArtworkSource,
	cursor: SameArtworkCursor | null = null
): Promise<SameArtworkPage> {
	const category =
		cursor?.category ?? (await withDeadline(fetchCommonsCategory(source.wikidataId)));
	if (category === null) return { candidates: [], cursor: null };
	const page = await withDeadline(
		fetchCategoryFiles(category, CANDIDATE_THUMBNAIL_WIDTH, cursor?.next ?? null)
	);
	const candidates = page.files
		.filter(({ file }) => !sameFile(file, source.file))
		.map(({ file, ...details }): ImageCandidate => ({
			wikidataId: source.wikidataId,
			title: source.title,
			authors: source.authors,
			image: toCandidateImage(file, details)
		}));
	return { candidates, cursor: page.next === null ? null : { category, next: page.next } };
}
