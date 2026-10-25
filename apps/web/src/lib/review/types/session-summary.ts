import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

export type SessionSummary = {
	count: number;
	minutes: number;
	tomorrow: number;
	groups: SummaryGroup[];
	free: boolean;
};
