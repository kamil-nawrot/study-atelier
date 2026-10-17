import { m } from '#lib/i18n/index.ts';

type ErrorLike = {
	code?: string;
	message?: string;
};

export function feedbackErrorMessage(error: ErrorLike): string {
	if (error.code === '23502' || error.code === '23514') return m.feedback.errors.invalid;
	if (!error.code && (error.message?.includes('fetch') ?? false)) return m.feedback.errors.network;
	return m.common.unexpectedError;
}
