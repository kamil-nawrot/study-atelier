import { m } from '#lib/i18n/index.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';

export function isNetworkError(error: ServiceError): boolean {
	return !error.code && (error.message?.includes('fetch') ?? false);
}

export function errorMessages(
	messagesByCode: Record<string, string>,
	network: string
): (error: ServiceError) => string {
	return (error) => {
		if (error.code && Object.hasOwn(messagesByCode, error.code)) return messagesByCode[error.code];
		if (isNetworkError(error)) return network;
		return m.common.unexpectedError;
	};
}
