import { m } from '#lib/i18n/index.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';
import { MAX_PINS_PER_IMAGE } from './types.ts';

type PinError = ServiceError & {
	hint?: string | null;
};

const PIN_LIMIT_HINT = 'pin_limit';

const pinMessages = errorMessages(
	{
		'23514': m.pins.errors.empty,
		P0002: m.pins.errors.notFound,
		PGRST116: m.pins.errors.notFound
	},
	m.pins.errors.network
);

export function pinErrorMessage(error: PinError): string {
	if (error.code === '23514' && error.hint === PIN_LIMIT_HINT) {
		return m.pins.errors.tooMany(MAX_PINS_PER_IMAGE);
	}
	return pinMessages(error);
}
