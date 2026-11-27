import {
	imageSelectable,
	imagesOf,
	offeredImages,
	ownImageKey,
	ownImageSelectable
} from '#lib/compare/album-merge-images/album-merge-images.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeRow } from '#lib/compare/types/merge-row.ts';
import type { TickItem } from '#lib/compare/types/tick-item.ts';
import { albumCredit } from '#lib/images/credit/credit.ts';
import { m } from '#lib/i18n/i18n.ts';

type ImageSides = {
	mine: ComparedSide;
	album: ComparedSide;
	changes: MergeChanges;
	toggleImage: (path: string) => void;
	toggleOwnImage: (key: string) => void;
};

export function imageRow({
	mine,
	album,
	changes,
	toggleImage,
	toggleOwnImage
}: ImageSides): MergeRow {
	const offered = offeredImages(mine, album);
	const own = imagesOf(mine);
	const label = m.compare.images;
	const albumItems: TickItem[] = imagesOf(album).flatMap((image) => {
		if (image.kind !== 'album') return [];
		const credit = albumCredit(image.licence, image.attribution);
		if (!offered.includes(image)) return [{ text: credit, image, credit }];
		return [
			{
				text: credit,
				image,
				credit,
				ticked: changes.images.includes(image.path),
				disabled: !imageSelectable(mine, changes, image.path),
				ontoggle: () => toggleImage(image.path)
			}
		];
	});
	if (offered.length === 0) {
		return {
			key: 'images',
			label,
			kind: 'plain',
			mine: own.map((image) => ({ text: '', image })),
			album: albumItems
		};
	}
	const ownItems: TickItem[] = own.map((image, index) => {
		const key = ownImageKey(image, index);
		return {
			text: '',
			image,
			ticked: !changes.droppedImages.includes(key),
			disabled: !ownImageSelectable(mine, changes, key),
			ontoggle: () => toggleOwnImage(key)
		};
	});
	return { key: 'images', label, kind: 'tick', mine: ownItems, album: albumItems };
}
