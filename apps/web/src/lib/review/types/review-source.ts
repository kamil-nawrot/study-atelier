import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewPlan } from '#lib/review/types/review-plan.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type ReviewSource = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	newToday: number;
	plan?: ReviewPlan;
	streak: number;
	preferences: Preferences;
	termPins: number | undefined;
	glossary: GlossaryTerm[];
};
