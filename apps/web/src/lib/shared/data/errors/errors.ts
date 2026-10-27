import { m } from '#lib/i18n/i18n.ts';
import {
	ROW_LIMIT_CODE,
	ROW_LIMITS,
	isLimitedTable,
	type LimitedTable
} from '#lib/shared/data/limits/limits.ts';
import { reportError } from '#lib/shared/monitoring/monitoring.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';

const LIMIT_MESSAGES: Record<LimitedTable, (limit: number) => string> = {
	artworks: m.limits.artworks,
	category_values: m.limits.categoryValues,
	glossary_entries: m.limits.glossaryEntries,
	timeline_events: m.limits.timelineEvents,
	visits: m.limits.visits,
	artwork_fields: m.limits.artworkFields,
	review_log: m.limits.reviewAnswers,
	feedback: m.limits.feedback
};

export function isNetworkError(error: ServiceError): boolean {
	return !error.code && (error.message?.includes('fetch') ?? false);
}

export function isRowLimitError(error: ServiceError): boolean {
	return error.code === ROW_LIMIT_CODE;
}

export function rowLimitMessage(error: ServiceError): string | undefined {
	if (!isRowLimitError(error) || !error.hint || !isLimitedTable(error.hint)) return undefined;
	return LIMIT_MESSAGES[error.hint](ROW_LIMITS[error.hint]);
}

export function errorMessages(
	messagesByCode: Record<string, string>,
	network: string
): (error: ServiceError) => string {
	return (error) => {
		if (error.code && Object.hasOwn(messagesByCode, error.code)) return messagesByCode[error.code];
		const limit = rowLimitMessage(error);
		if (limit) return limit;
		if (isNetworkError(error)) return network;
		reportError(error);
		return m.common.unexpectedError;
	};
}
