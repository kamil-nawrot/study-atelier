import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';

export function isNameTakenError(error: ServiceError): boolean {
	return error.code === '23505';
}

export const symbolErrorMessage = errorMessages(
	{
		P0002: m.symbols.errors.notFound,
		PGRST116: m.symbols.errors.notFound,
		'23502': m.symbols.errors.invalid,
		'23503': m.symbols.errors.invalid,
		'23514': m.symbols.errors.invalid,
		'22023': m.symbols.errors.invalid
	},
	m.common.network
);
