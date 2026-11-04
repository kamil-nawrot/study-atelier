import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { orderItems } from '#lib/review/order-guess/order-guess.ts';
import type { OrderItem } from '#lib/review/types/order-item.ts';
import type { SessionRow } from '#lib/review/types/session-row.ts';
import type { YearItem } from '#lib/review/types/year-item.ts';
import { yearItems } from '#lib/review/year-guess/year-guess.ts';

type TimeStep = YearItem | OrderItem;

export function timeQuestions(
	rows: SessionRow[],
	artworks: Map<string, WallArtwork>,
	today: Date
): TimeStep[] {
	return [...yearItems(rows, artworks, today), ...orderItems(rows, artworks)];
}

export function timeArtworks(steps: TimeStep[]): WallArtwork[] {
	return steps.flatMap((step) => (step.mode === 'year' ? [step.artwork] : step.artworks));
}

export function withTimeImages(
	step: TimeStep,
	withImage: (artwork: WallArtwork) => WallArtwork
): TimeStep {
	return step.mode === 'year'
		? { ...step, artwork: withImage(step.artwork) }
		: { ...step, artworks: step.artworks.map(withImage) };
}
