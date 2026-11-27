import { commonsThumbnailSrcset, type CommonsFile } from '#lib/images/commons/commons.ts';
import type { CandidateImage } from '#lib/images/types/candidate-image.ts';
import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export function imageFromCandidate(candidate: ImageCandidate): ArtworkImageInput {
	return {
		kind: 'commons',
		wikidataId: candidate.wikidataId,
		file: candidate.image.file,
		licence: candidate.image.licence,
		licenceUrl: candidate.image.licenceUrl,
		attribution: candidate.image.attribution,
		width: candidate.image.width,
		height: candidate.image.height
	};
}

export const CANDIDATE_THUMBNAIL_WIDTH = 330;

const CANDIDATE_WIDTHS = [250, 330, 500] as const;

export function toCandidateImage(file: string, details: CommonsFile): CandidateImage {
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
