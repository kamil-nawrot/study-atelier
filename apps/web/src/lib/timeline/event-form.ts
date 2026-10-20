import { parseYear } from '#lib/collection/artwork-form.ts';
import { validateYears, type YearsInput } from '#lib/collection/artwork-record.ts';
import { signedYear } from '#lib/collection/format.ts';
import { m } from '#lib/i18n/index.ts';
import type { TimelineEvent, TimelineEventDraft } from './types.ts';

export const EVENT_NAME_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MAX_LENGTH = 300;

export type EventFormState = {
	name: string;
	spanMode: boolean;
	yearFrom: string;
	fromBeforeCommonEra: boolean;
	yearTo: string;
	toBeforeCommonEra: boolean;
	yearApproximate: boolean;
	description: string;
};

export type EventFormErrors = {
	name?: string;
	yearFrom?: string;
	yearTo?: string;
};

export function emptyEventForm(): EventFormState {
	return {
		name: '',
		spanMode: false,
		yearFrom: '',
		fromBeforeCommonEra: false,
		yearTo: '',
		toBeforeCommonEra: false,
		yearApproximate: false,
		description: ''
	};
}

export function eventFormOf(event: TimelineEvent): EventFormState {
	return {
		name: event.name,
		spanMode: event.yearFrom !== null,
		yearFrom: event.yearFrom === null ? '' : String(Math.abs(event.yearFrom)),
		fromBeforeCommonEra: event.yearFrom !== null && event.yearFrom < 0,
		yearTo: String(Math.abs(event.yearTo)),
		toBeforeCommonEra: event.yearTo < 0,
		yearApproximate: event.yearApproximate,
		description: event.description
	};
}

function years(form: EventFormState): YearsInput {
	return {
		yearFrom: form.spanMode ? parseYear(form.yearFrom) : null,
		fromBeforeCommonEra: form.spanMode && form.fromBeforeCommonEra,
		yearTo: parseYear(form.yearTo),
		toBeforeCommonEra: form.toBeforeCommonEra,
		yearApproximate: form.yearApproximate
	};
}

export function validateEventForm(form: EventFormState): EventFormErrors {
	const input = years(form);
	const errors: EventFormErrors = { ...validateYears(input) };
	if (!form.name.trim()) errors.name = m.timeline.form.nameRequired;
	if (input.yearTo === null && !errors.yearTo) errors.yearTo = m.timeline.form.yearRequired;
	return errors;
}

export function draftOfEventForm(form: EventFormState): TimelineEventDraft {
	const input = years(form);
	return {
		name: form.name.trim(),
		yearFrom: signedYear(input.yearFrom, input.fromBeforeCommonEra),
		yearTo: signedYear(input.yearTo, input.toBeforeCommonEra),
		yearApproximate: form.yearApproximate,
		description: form.description.trim()
	};
}

export function eventFormChanged(form: EventFormState, saved: EventFormState): boolean {
	return JSON.stringify(form) !== JSON.stringify(saved);
}
