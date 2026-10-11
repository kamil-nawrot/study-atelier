import { m } from '#lib/i18n/index.ts';

type PostgrestErrorLike = {
	code?: string;
	message?: string;
};

export function collectionErrorMessage(error: PostgrestErrorLike): string {
	if (!error.code && error.message?.includes('fetch')) return m.collectionErrors.network;
	return m.common.unexpectedError;
}
