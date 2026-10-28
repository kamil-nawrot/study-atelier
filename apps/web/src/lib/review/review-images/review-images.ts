import { QUIZ_TILE_SIZES } from '#lib/review/quiz/quiz.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
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

export function preloadSteps(steps: SessionStep[]): void {
	for (const step of steps) {
		if (step.mode === 'quiz_definition') continue;
		preload(step.artwork);
		for (const option of step.quiz?.options ?? []) {
			if (option.artwork) preload(option.artwork, QUIZ_TILE_SIZES);
		}
	}
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
