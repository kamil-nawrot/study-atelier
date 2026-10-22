import { m } from '#lib/i18n/index.ts';
import { MAX_PINS_PER_IMAGE } from './types.ts';

type ErrorLike = {
	code?: string;
	message?: string;
};

export function pinErrorMessage(error: ErrorLike): string {
	if (error.code === '23514') {
		return error.message?.includes('at most')
			? m.pins.errors.tooMany(MAX_PINS_PER_IMAGE)
			: m.pins.errors.empty;
	}
	if (error.code === 'P0002' || error.code === 'PGRST116') return m.pins.errors.notFound;
	if (!error.code && (error.message?.includes('fetch') ?? false)) return m.pins.errors.network;
	return m.common.unexpectedError;
}
