import type { ReviewCard } from './review-card.ts';

export type ExtraCard = Omit<ReviewCard, 'artworkId'> & {
	id: string;
	termId: string | null;
	symbolId: string | null;
};
