import { m } from '#lib/i18n/index.ts';

type ErrorLike = {
	code?: string;
	message?: string;
};

const messagesByCode: Record<string, string> = {
	P0002: m.glossary.errors.notFound,
	PGRST116: m.glossary.errors.notFound,
	'23502': m.glossary.errors.invalid,
	'23514': m.glossary.errors.invalid
};

export function isNameTakenError(error: ErrorLike): boolean {
	return error.code === '23505';
}

export function glossaryErrorMessage(error: ErrorLike): string {
	if (error.code && error.code in messagesByCode) return messagesByCode[error.code];
	if (!error.code && (error.message?.includes('fetch') ?? false)) return m.glossary.errors.network;
	return m.common.unexpectedError;
}
