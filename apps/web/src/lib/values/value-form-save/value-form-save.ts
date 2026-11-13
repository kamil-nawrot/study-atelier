import type { ResolvedPathname } from '$app/types';
import { m } from '#lib/i18n/i18n.ts';
import { createValue, saveValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import { subjectPath, valuePath } from '#lib/card-index/value-pages/value-pages.ts';
import { valueDetailsChanged } from '#lib/values/value-details/value-details.ts';
import { applyEraBounds } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { saveEraBounds } from '#lib/profile/era-bounds-data/era-bounds-data.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import {
	ensureCityPlace,
	saveValueDetails
} from '#lib/values/value-details-data/value-details-data.ts';
import { valueFormDetails } from '#lib/values/value-form/value-form.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';

type ValueFormSave = {
	subject: ValueSubject;
	form: ValueFormFields;
	saved: ValueFormFields;
	details: ValueDetails;
	name: string;
	mergeTarget?: CardIndexRecord;
	moveTo?: EraCode;
	linksChanged: boolean;
	junctions?: number[];
};

type ValueFormSaveResult =
	| { error: string; created?: ValueSubject }
	| { error?: undefined; path: ResolvedPathname; message: string };

async function created(subject: ValueSubject, name: string): Promise<ValueSubject | string> {
	if (subject.kind === 'era' || subject.record.id !== '') return subject;
	const result = await createValue(subject.record.category, name);
	if (result.id === undefined) return result.error ?? '';
	return { kind: subject.kind, record: { ...subject.record, id: result.id, name } };
}

async function savedBounds(junctions: number[] | undefined): Promise<string | undefined> {
	if (!junctions) return undefined;
	const result = await saveEraBounds(junctions);
	if (result.error) return result.error;
	applyEraBounds(junctions);
	return undefined;
}

async function savedPosition(
	placeId: string,
	form: ValueFormFields,
	saved: ValueFormFields
): Promise<string | undefined> {
	if (form.location?.city) return undefined;
	const point = form.location?.point ?? null;
	if (JSON.stringify(point) === JSON.stringify(saved.location?.point ?? null)) return undefined;
	const result = await setPlacePoint(
		placeId,
		point,
		point ? (form.location?.wikidataId ?? null) : null
	);
	return result.error;
}

async function savedDetails(
	subject: ValueSubject,
	input: ValueFormSave
): Promise<string | undefined> {
	const details = valueFormDetails(input.form);
	const city = details.location?.placeType === 'city' ? null : details.location?.city;
	if (details.location && city && !city.id) {
		const ensured = await ensureCityPlace(city);
		if (ensured.error !== undefined) return ensured.error;
		details.location.city = { ...city, id: ensured.id };
	}
	if (valueDetailsChanged(details, valueFormDetails(input.saved))) {
		const result = await saveValueDetails(subject, details, input.details);
		if (result.error) return result.error;
	}
	return subject.kind === 'location'
		? savedPosition(subject.record.id, input.form, input.saved)
		: undefined;
}

export async function saveValueForm(input: ValueFormSave): Promise<ValueFormSaveResult> {
	const { form, mergeTarget } = input;
	const creating = input.subject.kind !== 'era' && input.subject.record.id === '';
	const subject = await created(input.subject, input.name);
	if (typeof subject === 'string') return { error: subject };
	const fail = (error: string): ValueFormSaveResult =>
		creating ? { error, created: subject } : { error };

	const boundsError = await savedBounds(input.junctions);
	if (boundsError) return fail(boundsError);

	const detailsError = mergeTarget ? undefined : await savedDetails(subject, input);
	if (detailsError) return fail(detailsError);

	if (subject.kind !== 'era') {
		const { record } = subject;
		const result = await saveValue({
			record,
			name: input.name,
			eraCodes: record.category === 'period' && input.linksChanged ? form.eraCodes : undefined,
			moveTo: input.moveTo,
			periodIds: record.category === 'style' && input.linksChanged ? form.periodIds : undefined,
			mergeInto: mergeTarget
		});
		if (result.error) return fail(result.error);
		if (mergeTarget) {
			return {
				path: valuePath(record.category, mergeTarget.id),
				message: m.cardIndex.merged(mergeTarget.name)
			};
		}
		if (creating) {
			return {
				path: subjectPath(subject),
				message: m.valueForm.created(m.cardIndex.kinds[record.category].accusative, input.name)
			};
		}
	}
	return { path: subjectPath(subject), message: m.valuePage.saved };
}
