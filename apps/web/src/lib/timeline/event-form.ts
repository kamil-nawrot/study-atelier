import { parseYear } from '#lib/collection/artwork-form.ts';
import { validateYears, type YearsInput } from '#lib/collection/artwork-record.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import { m } from '#lib/i18n/index.ts';
import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { EventDates, TimelineEvent, TimelineEventDraft } from './types.ts';

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
	source: WikipediaSource | null;
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
		description: '',
		source: null
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
		description: event.description,
		source: event.source
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
		description: form.description.trim(),
		source: form.source
	};
}

export function withDates(form: EventFormState, dates: EventDates): EventFormState {
	return {
		...form,
		spanMode: dates.yearFrom !== null,
		yearFrom: dates.yearFrom === null ? '' : String(Math.abs(dates.yearFrom)),
		fromBeforeCommonEra: dates.yearFrom !== null && dates.yearFrom < 0,
		yearTo: String(Math.abs(dates.yearTo)),
		toBeforeCommonEra: dates.yearTo < 0,
		yearApproximate: dates.approximate
	};
}

export function withoutDates(form: EventFormState): EventFormState {
	const empty = emptyEventForm();
	return {
		...form,
		spanMode: empty.spanMode,
		yearFrom: empty.yearFrom,
		fromBeforeCommonEra: empty.fromBeforeCommonEra,
		yearTo: empty.yearTo,
		toBeforeCommonEra: empty.toBeforeCommonEra,
		yearApproximate: empty.yearApproximate
	};
}

export function datesKey(form: EventFormState): string {
	const { spanMode, yearFrom, fromBeforeCommonEra, yearTo, toBeforeCommonEra, yearApproximate } =
		form;
	return JSON.stringify([
		spanMode,
		spanMode ? yearFrom.trim() : '',
		spanMode && fromBeforeCommonEra,
		yearTo.trim(),
		toBeforeCommonEra,
		yearApproximate
	]);
}

export function hasNoDates(form: EventFormState): boolean {
	return form.yearTo.trim() === '' && (!form.spanMode || form.yearFrom.trim() === '');
}

export function eventFormChanged(form: EventFormState, saved: EventFormState): boolean {
	return JSON.stringify(form) !== JSON.stringify(saved);
}
