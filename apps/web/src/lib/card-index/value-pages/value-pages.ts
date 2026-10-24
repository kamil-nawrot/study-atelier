import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { m } from '#lib/i18n/i18n.ts';
import { erasOfPeriod, findRecord, periodsOfStyle } from '#lib/card-index/card-index/card-index.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import type { ValueKind } from '#lib/card-index/types/value-kind.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ValueParent } from '#lib/card-index/types/value-parent.ts';

export const SUMMARY_MAX_LENGTH = 300;

const VALUE_KINDS: readonly ValueKind[] = [
	'era',
	'period',
	'style',
	'material',
	'author',
	'location'
];

export function isValueKind(value: string): value is ValueKind {
	return (VALUE_KINDS as readonly string[]).includes(value);
}

export function valuePath(kind: ValueKind, id: string): ResolvedPathname {
	return resolve('/(app)/atelier/values/[kind]/[id]', { kind, id });
}

export function valueEditPath(kind: ValueKind, id: string): ResolvedPathname {
	return resolve('/(app)/atelier/values/[kind]/[id]/edit', { kind, id });
}

export function subjectPath(subject: ValueSubject): ResolvedPathname {
	return valuePath(subject.kind, subjectId(subject));
}

export function subjectId(subject: ValueSubject): string {
	return subject.kind === 'era' ? subject.code : subject.record.id;
}

export function subjectName(subject: ValueSubject): string {
	return subject.kind === 'era' ? m.eras[subject.code].name : subject.record.name;
}

export function findSubject(
	index: CardIndexData,
	kind: string,
	id: string
): ValueSubject | undefined {
	if (kind === 'era') return isEraCode(id) ? { kind, code: id } : undefined;
	const record = findRecord(index, id);
	return record && record.category === kind ? { kind: record.category, record } : undefined;
}

export function valueKindName(kind: ValueKind): string {
	return kind === 'era' ? m.valuePage.eraKind : m.cardIndex.kinds[kind].name;
}

export function valueParents(index: CardIndexData, subject: ValueSubject): ValueParent[] {
	if (subject.kind === 'period') {
		return erasOfPeriod(index, subject.record.id).map((code) => ({
			kind: 'era',
			id: code,
			name: m.eras[code].name,
			era: code
		}));
	}
	if (subject.kind === 'style') {
		return periodsOfStyle(index, subject.record.id).map((period: CardIndexRecord) => ({
			kind: 'period',
			id: period.id,
			name: period.name
		}));
	}
	return [];
}

function usesValue(artwork: WallArtwork, subject: ValueSubject): boolean {
	switch (subject.kind) {
		case 'era':
			return artwork.eraCode === subject.code;
		case 'period':
			return artwork.period === subject.record.name;
		case 'style':
			return artwork.styles.includes(subject.record.name);
		case 'material':
			return artwork.materials.includes(subject.record.name);
		case 'author':
			return artwork.authors.includes(subject.record.name);
		case 'location':
			return artwork.location === subject.record.name;
	}
}

function chronologically(a: WallArtwork, b: WallArtwork): number {
	if (a.yearTo === null || b.yearTo === null) {
		if (a.yearTo !== b.yearTo) return a.yearTo === null ? 1 : -1;
	} else if (a.yearTo !== b.yearTo) {
		return a.yearTo - b.yearTo;
	}
	return a.number - b.number;
}

export function artworksOfValue(artworks: WallArtwork[], subject: ValueSubject): WallArtwork[] {
	return artworks.filter((artwork) => usesValue(artwork, subject)).sort(chronologically);
}
