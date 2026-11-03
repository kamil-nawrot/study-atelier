import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';
import type { GrowthUnit } from '#lib/statistics/types/growth-unit.ts';

type StatisticsRow = {
	terms: number;
	events: number;
	visits: number;
	quiz_answers: number;
	correct_answers: number;
	most_reviewed: { artwork_id: string; times: number }[];
	growth: {
		unit: GrowthUnit;
		first_day: string;
		buckets: { start: string; added: number }[];
	} | null;
	authors_with_years: number;
	longest_lived: {
		value_id: string;
		name: string;
		birth_year: number;
		death_year: number;
		years_approximate: boolean;
		tied: number;
	} | null;
	most_pinned: { artwork_id: string; pins: number; tied: number } | null;
	largest_visit: {
		visit_id: string;
		place: string;
		visited_on: string;
		date_precision: string;
		artworks: number;
		tied: number;
	} | null;
};

type StatisticsResult = {
	statistics?: CollectionStatistics;
	error?: string;
};

const statisticsErrorMessage = errorMessages({}, m.statistics.loadError);

export async function loadCollectionStatistics(): Promise<StatisticsResult> {
	const { data, error } = await supabase.rpc('collection_statistics');
	if (error) return { error: statisticsErrorMessage(error) };
	return { statistics: statisticsOf(data as unknown as StatisticsRow) };
}

function statisticsOf(row: StatisticsRow): CollectionStatistics {
	const visit = row.largest_visit;
	const author = row.longest_lived;
	return {
		terms: row.terms,
		events: row.events,
		visits: row.visits,
		quizAnswers: row.quiz_answers,
		correctAnswers: row.correct_answers,
		mostReviewed: row.most_reviewed.map((item) => ({
			artworkId: item.artwork_id,
			times: item.times
		})),
		growth: row.growth && {
			unit: row.growth.unit,
			firstDay: row.growth.first_day,
			buckets: row.growth.buckets
		},
		authorsWithYears: row.authors_with_years,
		longestLived: author && {
			valueId: author.value_id,
			name: author.name,
			birthYear: author.birth_year,
			deathYear: author.death_year,
			yearsApproximate: author.years_approximate,
			tied: author.tied
		},
		mostPinned: row.most_pinned && {
			artworkId: row.most_pinned.artwork_id,
			pins: row.most_pinned.pins,
			tied: row.most_pinned.tied
		},
		largestVisit: visit && {
			visitId: visit.visit_id,
			place: visit.place,
			visitedOn: visit.visited_on,
			datePrecision: visit.date_precision,
			artworks: visit.artworks,
			tied: visit.tied
		}
	};
}
