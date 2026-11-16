import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';

export const flagErrorMessage = errorMessages(
	{ '23503': m.backroom.errors.gone, '23514': m.backroom.errors.invalid },
	m.common.network
);
