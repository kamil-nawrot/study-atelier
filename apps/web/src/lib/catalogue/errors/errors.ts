import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';

export const collectionErrorMessage = errorMessages({}, m.collectionErrors.network);

export const cardIndexErrorMessage = errorMessages(
	{
		P0002: m.cardIndex.errors.notFound,
		'23001': m.cardIndex.errors.changed,
		'23505': m.cardIndex.errors.changed,
		'23514': m.cardIndex.errors.changed
	},
	m.common.network
);

export const artworkErrorMessage = errorMessages(
	{
		P0002: m.artworkErrors.notFound,
		'23502': m.artworkErrors.invalid,
		'23514': m.artworkErrors.invalid,
		'23001': m.artworkErrors.conflict,
		'23503': m.artworkErrors.conflict,
		'23505': m.artworkErrors.conflict
	},
	m.common.network
);
