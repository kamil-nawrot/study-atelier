import {
	sortRecords,
	type CardIndexSort
} from '#lib/card-index/card-index-sort/card-index-sort.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { CardIndexEntry } from '#lib/card-index/types/card-index-entry.ts';
import type { CardIndexPeriod } from '#lib/card-index/types/card-index-period.ts';
import type { CardIndexTimeline } from '#lib/card-index/types/card-index-timeline.ts';

export function narrowTimeline(
	timeline: CardIndexTimeline,
	query: string,
	sort: CardIndexSort
): CardIndexTimeline {
	const term = normalizeForSearch(query);
	const matches = (entry: CardIndexEntry): boolean => normalizeForSearch(entry.name).includes(term);
	const styles = (list: CardIndexEntry[]): CardIndexEntry[] =>
		sortRecords(term ? list.filter(matches) : list, sort);
	const periods = (list: CardIndexPeriod[]): CardIndexPeriod[] =>
		sortRecords(
			list.flatMap((period) => {
				const found = !term || matches(period);
				const kept = found ? sortRecords(period.styles, sort) : styles(period.styles);
				return found || kept.length > 0 ? [{ ...period, styles: kept }] : [];
			}),
			sort
		);

	return {
		eras: timeline.eras
			.map((era) => ({ ...era, periods: periods(era.periods) }))
			.filter((era) => !term || era.periods.length > 0),
		periodsWithoutEra: periods(timeline.periodsWithoutEra),
		stylesWithoutPeriod: styles(timeline.stylesWithoutPeriod)
	};
}
