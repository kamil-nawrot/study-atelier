import type { ReviewScope } from './review-scope.ts';

export type PlannedScope = {
	scope: ReviewScope;
	known: number;
	fresh: number;
	artworks: number;
};
