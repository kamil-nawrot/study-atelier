import { m } from '#lib/i18n/index.ts';

type ErrorLike = {
	code?: string;
	message?: string;
};

const messagesByCode: Record<string, string> = {
	P0002: m.timeline.errors.notFound,
	PGRST116: m.timeline.errors.notFound,
	'23502': m.timeline.errors.invalid,
	'23514': m.timeline.errors.invalid
};

export function timelineErrorMessage(error: ErrorLike): string {
	if (error.code && error.code in messagesByCode) return messagesByCode[error.code];
	if (!error.code && (error.message?.includes('fetch') ?? false)) return m.timeline.errors.network;
	return m.common.unexpectedError;
}
