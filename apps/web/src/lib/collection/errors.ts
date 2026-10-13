import { m } from '#lib/i18n/index.ts';

type PostgrestErrorLike = {
	code?: string;
	message?: string;
};

const artworkMessagesByCode: Record<string, string> = {
	P0002: m.artworkErrors.notFound,
	'23502': m.artworkErrors.invalid,
	'23514': m.artworkErrors.invalid
};

function isNetworkError(error: PostgrestErrorLike): boolean {
	return !error.code && (error.message?.includes('fetch') ?? false);
}

export function collectionErrorMessage(error: PostgrestErrorLike): string {
	if (isNetworkError(error)) return m.collectionErrors.network;
	return m.common.unexpectedError;
}

const cardIndexMessagesByCode: Record<string, string> = {
	P0002: m.cardIndex.errors.notFound,
	'23001': m.cardIndex.errors.changed,
	'23505': m.cardIndex.errors.changed,
	'23514': m.cardIndex.errors.changed
};

export function cardIndexErrorMessage(error: PostgrestErrorLike): string {
	if (error.code && error.code in cardIndexMessagesByCode) {
		return cardIndexMessagesByCode[error.code];
	}
	if (isNetworkError(error)) return m.cardIndex.errors.network;
	return m.common.unexpectedError;
}

export function artworkErrorMessage(error: PostgrestErrorLike): string {
	if (error.code && error.code in artworkMessagesByCode) return artworkMessagesByCode[error.code];
	if (isNetworkError(error)) return m.artworkErrors.network;
	return m.common.unexpectedError;
}
