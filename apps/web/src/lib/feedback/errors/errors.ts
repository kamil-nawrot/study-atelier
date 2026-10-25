import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';

export const feedbackErrorMessage = errorMessages(
	{ '23502': m.feedback.errors.invalid, '23514': m.feedback.errors.invalid },
	m.feedback.errors.network
);
