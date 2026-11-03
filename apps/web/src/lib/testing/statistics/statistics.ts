import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

export function testStatistics(
	overrides: Partial<CollectionStatistics> = {}
): CollectionStatistics {
	return {
		terms: 0,
		events: 0,
		visits: 0,
		quizAnswers: 0,
		correctAnswers: 0,
		mostReviewed: [],
		growth: null,
		authorsWithYears: 0,
		longestLived: null,
		mostPinned: null,
		largestVisit: null,
		...overrides
	};
}
