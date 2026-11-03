import type { GrowthUnit } from '#lib/statistics/types/growth-unit.ts';

export type CollectionStatistics = {
	terms: number;
	events: number;
	visits: number;
	quizAnswers: number;
	correctAnswers: number;
	mostReviewed: { artworkId: string; times: number }[];
	growth: {
		unit: GrowthUnit;
		firstDay: string;
		buckets: { start: string; added: number }[];
	} | null;
	authorsWithYears: number;
	longestLived: {
		valueId: string;
		name: string;
		birthYear: number;
		deathYear: number;
		yearsApproximate: boolean;
		tied: number;
	} | null;
	mostPinned: { artworkId: string; pins: number; tied: number } | null;
	largestVisit: {
		visitId: string;
		place: string;
		visitedOn: string;
		datePrecision: string;
		artworks: number;
		tied: number;
	} | null;
};
