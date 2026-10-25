import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export function preload(artwork: WallArtwork, sizes = '(min-width: 768px) 60vw, 100vw'): void {
	const image = artwork.image;
	if (!image?.src) return;
	const loader = new Image();
	if (image.srcset) {
		loader.sizes = sizes;
		loader.srcset = image.srcset;
	}
	loader.src = image.src;
	void loader.decode().catch(() => undefined);
}

export function withItemImages(
	item: ReviewItem,
	withImage: (artwork: WallArtwork) => WallArtwork
): ReviewItem {
	return {
		...item,
		artwork: withImage(item.artwork),
		...(item.quiz
			? {
					quiz: {
						...item.quiz,
						options: item.quiz.options.map((option) =>
							option.artwork ? { ...option, artwork: withImage(option.artwork) } : option
						)
					}
				}
			: {})
	};
}
