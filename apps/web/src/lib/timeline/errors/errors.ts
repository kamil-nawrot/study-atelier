import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';

export const timelineErrorMessage = errorMessages(
	{
		P0002: m.timeline.errors.notFound,
		PGRST116: m.timeline.errors.notFound,
		'23502': m.timeline.errors.invalid,
		'23514': m.timeline.errors.invalid
	},
	m.common.network
);
