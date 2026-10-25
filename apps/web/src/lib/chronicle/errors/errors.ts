import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';

export const chronicleErrorMessage = errorMessages(
	{
		P0002: m.chronicle.errors.notFound,
		PGRST116: m.chronicle.errors.notFound,
		'23502': m.chronicle.errors.invalid,
		'23503': m.chronicle.errors.invalid,
		'23514': m.chronicle.errors.invalid
	},
	m.chronicle.errors.network
);
