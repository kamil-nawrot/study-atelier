import { m } from '#lib/i18n/i18n.ts';
import {
	erasOfPeriod,
	periodsOfStyle,
	planEraMove
} from '#lib/card-index/card-index/card-index.ts';
import { eraName } from '#lib/catalogue/eras/eras.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import {
	authorDetailsFromForm,
	authorFormFromDetails,
	emptyAuthorDetails
} from '#lib/values/author-form/author-form.ts';
import { valueDetailsChanged } from '#lib/values/value-details/value-details.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';

export function initialValueForm(
	record: CardIndexRecord | undefined,
	index: CardIndexData,
	details: ValueDetails
): ValueFormFields {
	return {
		name: record?.name ?? '',
		eraCodes: record?.category === 'period' ? erasOfPeriod(index, record.id) : [],
		periodIds:
			record?.category === 'style'
				? periodsOfStyle(index, record.id).map((period) => period.id)
				: [],
		details: { summary: details.summary, notes: details.notes },
		author:
			record?.category === 'author'
				? authorFormFromDetails(details.author ?? emptyAuthorDetails())
				: null,
		location:
			record?.category === 'location'
				? { ...(details.location ?? { countryCode: null, placeType: null }) }
				: null
	};
}

export function valueFormDetails(state: ValueFormFields): ValueDetails {
	return {
		...state.details,
		author: state.author ? authorDetailsFromForm(state.author) : undefined,
		location: state.location ? { ...state.location } : undefined
	};
}

export function sameItems(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((item) => b.includes(item));
}

export function valueFormChanged(current: ValueFormFields, reference: ValueFormFields): boolean {
	return (
		current.name.trim() !== reference.name.trim() ||
		!sameItems(current.eraCodes, reference.eraCodes) ||
		!sameItems(current.periodIds, reference.periodIds) ||
		valueDetailsChanged(current.details, reference.details) ||
		JSON.stringify(current.author) !== JSON.stringify(reference.author) ||
		JSON.stringify(current.location) !== JSON.stringify(reference.location)
	);
}

export function moveDescription(
	record: CardIndexRecord,
	eraMove: ReturnType<typeof planEraMove>
): string {
	const { moveConfirm } = m.cardIndex;
	const removed = eraMove.removed.map(eraName).join(', ');
	if (eraMove.remaining.length === 0) {
		return moveConfirm.toNone(record.name, removed, eraMove.count);
	}
	if (eraMove.remaining.length === 1) {
		return moveConfirm.toEra(record.name, removed, eraMove.count, eraName(eraMove.remaining[0]));
	}
	return moveConfirm.toPicked(record.name, removed, eraMove.count);
}

export function mergeDescription(
	record: CardIndexRecord,
	target: CardIndexRecord,
	kindGenitive: string,
	hasContent: boolean
): string {
	const { mergeConfirm } = m.cardIndex;
	const merged = record.name;
	const kept = target.name;
	const ending = [
		...(hasContent ? [mergeConfirm.pageContent(merged)] : []),
		mergeConfirm.irreversible
	];
	const visits = record.visits ? [mergeConfirm.visits(merged, kept, record.visits)] : [];
	if (record.count === 0) {
		return [...(visits.length > 0 ? visits : [mergeConfirm.unused(merged)]), ...ending].join(' ');
	}
	if (record.category === 'period') {
		return [
			mergeConfirm.periodAssigned(merged, kept, record.count),
			mergeConfirm.periodLinks(merged, kept),
			...ending
		].join(' ');
	}
	return [
		mergeConfirm.assigned(merged, kept, record.count, kindGenitive),
		...visits,
		...ending
	].join(' ');
}
