import type { ReviewScope } from './review-scope.ts';

export type PlannedScope = {
	scope: ReviewScope;
	known: number;
	fresh: number;
	years: number;
	orders: number;
	artworks: number;
};
