import { m } from '#lib/i18n/index.ts';
import { MAX_PINS_PER_IMAGE } from './types.ts';

type ErrorLike = {
	code?: string;
	message?: string;
	hint?: string | null;
};

const PIN_LIMIT_HINT = 'pin_limit';

export function pinErrorMessage(error: ErrorLike): string {
	if (error.code === '23514' && error.hint === PIN_LIMIT_HINT) {
		return m.pins.errors.tooMany(MAX_PINS_PER_IMAGE);
	}
	if (error.code === '23514') return m.pins.errors.empty;
	if (error.code === 'P0002' || error.code === 'PGRST116') return m.pins.errors.notFound;
	if (!error.code && (error.message?.includes('fetch') ?? false)) return m.pins.errors.network;
	return m.common.unexpectedError;
}
