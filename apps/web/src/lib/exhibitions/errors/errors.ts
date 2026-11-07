import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import { ROW_LIMIT_CODE } from '#lib/shared/data/limits/limits.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';

const LIMIT_HINTS: Record<string, string> = {
	exhibition_artworks: m.exhibitions.limits.artworks,
	exhibition_blocks: m.exhibitions.limits.blocks
};

const byCode = errorMessages(
	{
		P0002: m.exhibitions.errors.notFound,
		PGRST116: m.exhibitions.errors.notFound,
		'23502': m.exhibitions.errors.invalid,
		'23514': m.exhibitions.errors.invalid
	},
	m.common.network
);

export function exhibitionErrorMessage(error: ServiceError): string {
	if (error.code === ROW_LIMIT_CODE && error.hint && Object.hasOwn(LIMIT_HINTS, error.hint)) {
		return LIMIT_HINTS[error.hint];
	}
	return byCode(error);
}

export function isRevisionConflict(error: ServiceError): boolean {
	return error.code === '40001' && error.hint === 'exhibition_revision';
}
