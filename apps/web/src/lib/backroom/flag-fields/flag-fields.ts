import type { FixField } from '#lib/backroom/types/fix-field.ts';
import type { FlagKind } from '#lib/backroom/types/flag-kind.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import { m } from '#lib/i18n/i18n.ts';

const ARTWORK_FIELDS: Record<FlagReason, FixField> = {
	image: 'image',
	pin: 'image',
	data: 'data',
	note: 'note',
	answers: 'data',
	date: 'top',
	hidden: 'top',
	definition: 'top',
	meaning: 'top',
	other: 'top'
};

const TERM_FIELDS: Partial<Record<FlagReason, FixField>> = {
	hidden: 'forms',
	definition: 'definition',
	answers: 'definition'
};

export function fieldOf(kind: FlagKind, reason: FlagReason): FixField {
	if (kind === 'artwork') return ARTWORK_FIELDS[reason];
	if (kind === 'term') return TERM_FIELDS[reason] ?? 'top';
	if (kind === 'event') return reason === 'date' ? 'date' : 'top';
	return reason === 'other' ? 'top' : 'meanings';
}

export function reasonText(reason: FlagReason, imageNumber: number | null): string {
	const text = m.backroom.reasons[reason];
	return imageNumber && (reason === 'image' || reason === 'pin')
		? `${text} (${m.backroom.imageNumber(imageNumber)})`
		: text;
}
