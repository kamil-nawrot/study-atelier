import { matchAlbumValue } from '#lib/albums/album-values/album-values.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumImage } from '#lib/albums/types/album-image.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import type { LearnerValue } from '#lib/albums/types/learner-value.ts';
import type { MatchedValue } from '#lib/albums/types/matched-value.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

export function valueKey(category: CategoryCode, name: string): string {
	return `${category}:${name}`;
}

export function albumImageInput(image: AlbumImage, wikidataId: string | null): ArtworkImageInput {
	return {
		kind: 'album',
		path: image.path,
		wikidataId,
		licence: image.licence,
		licenceUrl: image.licenceUrl,
		attribution: image.attribution,
		width: image.width,
		height: image.height
	};
}

type Matched = MatchedValue & { category: CategoryCode };

function matchedValues(
	album: Album,
	artwork: AlbumArtwork,
	learner: readonly LearnerValue[]
): Matched[] {
	return artwork.valueIds.flatMap((id) => {
		const value = album.values.find((candidate) => candidate.id === id);
		return value ? [{ category: value.category, ...matchAlbumValue(value, learner) }] : [];
	});
}

export function albumVersion(
	album: Album,
	artwork: AlbumArtwork,
	learner: readonly LearnerValue[]
): AlbumVersion {
	const values = matchedValues(album, artwork, learner);
	const names = (category: CategoryCode): string[] =>
		values.filter((value) => value.category === category).map((value) => value.name);
	const authors = names('author');
	const [image = null, ...images] = artwork.images.map((item) =>
		albumImageInput(item, artwork.wikidataId)
	);
	return {
		slug: album.slug,
		entryId: artwork.id,
		albumTitle: album.title,
		revision: artwork.revision,
		wikidataId: artwork.wikidataId,
		newValues: values
			.filter((value) => value.isNew)
			.map((value) => valueKey(value.category, value.name)),
		artwork: {
			title: artwork.title,
			authors,
			authorUnknown: authors.length === 0,
			yearFrom: artwork.yearFrom === null ? null : Math.abs(artwork.yearFrom),
			fromBeforeCommonEra: artwork.yearFrom !== null && artwork.yearFrom < 0,
			yearTo: artwork.yearTo === null ? null : Math.abs(artwork.yearTo),
			toBeforeCommonEra: artwork.yearTo !== null && artwork.yearTo < 0,
			yearApproximate: artwork.yearApproximate,
			typeCode: artwork.typeCode,
			eraCode: artwork.eraCode,
			period: names('period')[0] ?? null,
			styles: names('style'),
			materials: names('material'),
			location: names('location')[0] ?? null,
			notes: artwork.description ?? '',
			image,
			images
		}
	};
}
