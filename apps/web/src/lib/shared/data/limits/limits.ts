export const ROW_LIMITS = {
	artworks: 5000,
	category_values: 5000,
	glossary_entries: 2000,
	timeline_events: 2000,
	visits: 1000,
	artwork_fields: 100,
	artwork_values: 100000,
	visit_artworks: 20000,
	artwork_field_entries: 100000,
	review_log: 1000,
	feedback: 20
} as const;

export type LimitedTable = keyof typeof ROW_LIMITS;

export const DAILY_LIMITED_TABLES: ReadonlySet<LimitedTable> = new Set(['review_log', 'feedback']);

export const ROW_LIMIT_CODE = '53400';

export function isLimitedTable(name: string): name is LimitedTable {
	return Object.hasOwn(ROW_LIMITS, name);
}
