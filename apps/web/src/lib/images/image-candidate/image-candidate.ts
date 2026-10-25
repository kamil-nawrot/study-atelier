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
