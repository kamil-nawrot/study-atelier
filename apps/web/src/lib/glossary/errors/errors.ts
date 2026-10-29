import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';

export function isNameTakenError(error: ServiceError): boolean {
	return error.code === '23505';
}

export const glossaryErrorMessage = errorMessages(
	{
		P0002: m.glossary.errors.notFound,
		PGRST116: m.glossary.errors.notFound,
		'23502': m.glossary.errors.invalid,
		'23514': m.glossary.errors.invalid
	},
	m.common.network
);
