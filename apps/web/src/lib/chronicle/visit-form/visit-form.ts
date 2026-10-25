import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { m } from '#lib/i18n/i18n.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { dateFromParts, dateParts, isVisitDate } from '#lib/chronicle/visit-date/visit-date.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';
import type { VisitFormErrors } from '#lib/chronicle/types/visit-form-errors.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

export const SEARCH_RESULTS = 8;

export function placeOf(form: VisitFormState): string {
	return form.place[0]?.trim() ?? '';
}

export function placeArtworks(artworks: readonly WallArtwork[], place: string): WallArtwork[] {
	const key = valueKey(place);
	if (key === '') return [];
	return artworks.filter((artwork) => artwork.location && valueKey(artwork.location) === key);
}

export function emptyVisitForm(): VisitFormState {
	return {
		place: [],
		placeQuery: '',
		day: '',
		month: '',
		year: '',
		notes: '',
		chosen: [],
		extra: []
	};
}

export function visitFormOf(visit: Visit, artworks: readonly WallArtwork[]): VisitFormState {
	const atPlace = new Set(placeArtworks(artworks, visit.place).map((artwork) => artwork.id));
	const known = new Set(artworks.map((artwork) => artwork.id));
	return {
		place: [visit.place],
		placeQuery: '',
		...dateParts(visit.date),
		notes: visit.notes,
		chosen: visit.artworkIds.filter((id) => known.has(id)),
		extra: visit.artworkIds.filter((id) => known.has(id) && !atPlace.has(id))
	};
}

export function withPlaceArtworks(
	form: VisitFormState,
	artworks: readonly WallArtwork[],
	saved?: VisitFormState
): VisitFormState {
	const extra = new Set(form.extra);
	const atPlace = new Set(placeArtworks(artworks, placeOf(form)).map((artwork) => artwork.id));
	const savedPlace = saved && valueKey(placeOf(saved)) === valueKey(placeOf(form));
	const ticked = savedPlace ? saved.chosen.filter((id) => atPlace.has(id)) : [...atPlace];
	const kept = form.chosen.filter((id) => extra.has(id) && !atPlace.has(id));
	return {
		...form,
		chosen: [...ticked, ...kept],
		extra: form.extra.filter((id) => !atPlace.has(id))
	};
}

export function toggled(form: VisitFormState, id: string): VisitFormState {
	const chosen = form.chosen.includes(id)
		? form.chosen.filter((item) => item !== id)
		: [...form.chosen, id];
	return { ...form, chosen };
}

export function withExtra(form: VisitFormState, id: string): VisitFormState {
	if (form.extra.includes(id)) return form;
	return { ...form, extra: [...form.extra, id], chosen: [...form.chosen, id] };
}

export function searchArtworks(
	artworks: readonly WallArtwork[],
	query: string,
	shown: ReadonlySet<string>
): WallArtwork[] {
	const key = normalizeForSearch(query.trim());
	if (key === '') return [];
	return artworks
		.filter((artwork) => !shown.has(artwork.id))
		.filter((artwork) =>
			[artwork.title, ...artwork.authors].some((text) => normalizeForSearch(text).includes(key))
		)
		.slice(0, SEARCH_RESULTS);
}

export function validateVisitForm(form: VisitFormState): VisitFormErrors {
	const errors: VisitFormErrors = {};
	if (placeOf(form) === '') errors.place = m.chronicle.form.placeRequired;
	const date = dateFromParts(form);
	if (date === 'yearMissing') errors.year = m.chronicle.form.yearRequired;
	if (date === 'yearInvalid') errors.year = m.chronicle.form.yearInvalid;
	if (date === 'monthMissing') errors.month = m.chronicle.form.monthRequired;
	if (date === 'dayInvalid') errors.day = m.chronicle.form.dayInvalid;
	return errors;
}

export function draftOfVisitForm(form: VisitFormState, kept: readonly string[] = []): VisitDraft {
	const date = dateFromParts(form);
	if (!isVisitDate(date)) throw new Error('the visit form was not validated');
	return {
		place: placeOf(form),
		date,
		notes: form.notes,
		artworkIds: [...new Set([...form.chosen, ...kept])]
	};
}

export function visitFormChanged(current: VisitFormState, saved: VisitFormState): boolean {
	const sameSet = (a: string[], b: string[]): boolean =>
		a.length === b.length && a.every((id) => b.includes(id));
	return (
		placeOf(current) !== placeOf(saved) ||
		current.day.trim() !== saved.day.trim() ||
		current.month !== saved.month ||
		current.year.trim() !== saved.year.trim() ||
		current.notes !== saved.notes ||
		!sameSet(current.chosen, saved.chosen) ||
		!sameSet(current.extra, saved.extra)
	);
}
