import { sameName } from '#lib/albums/album-values/album-values.ts';
import { formatDate } from '#lib/catalogue/years/years.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumEvent } from '#lib/albums/types/album-event.ts';
import type { AlbumItem } from '#lib/albums/types/album-item.ts';
import type { AlbumItemPart } from '#lib/albums/types/album-item-part.ts';
import type { AlbumItemState } from '#lib/albums/types/album-item-state.ts';
import type { AlbumTerm } from '#lib/albums/types/album-term.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import type { ItemMatches } from '#lib/albums/types/item-matches.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { AuthorDetails } from '#lib/values/types/author-details.ts';
import type { LocationDetails } from '#lib/values/types/location-details.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';

export const ITEM_PARTS: readonly AlbumItemPart[] = ['terms', 'figures', 'events', 'values'];

const DESCRIBED_CATEGORIES = new Set(['author', 'location', 'period', 'style']);

function filled(text: string | null | undefined): text is string {
	return (text ?? '').trim() !== '';
}

function namesOf(item: { name: string; alternativeNames: readonly string[] }): string[] {
	return [item.name, ...item.alternativeNames];
}

function termFillable(term: AlbumTerm, entry: GlossaryEntry): boolean {
	const figure = entry.figure;
	return (
		(!filled(entry.definition) && filled(term.definition)) ||
		(entry.category === null && term.category !== null) ||
		(entry.synonyms.length === 0 && term.alternativeNames.length > 0) ||
		(figure !== undefined &&
			((figure.birthYear === null && term.birthYear !== null) ||
				(figure.deathYear === null && term.deathYear !== null) ||
				(!filled(figure.country) && filled(term.country))))
	);
}

function termState(term: AlbumTerm, entry: GlossaryEntry | undefined): AlbumItemState {
	if (!entry) return 'new';
	return entry.kind === term.kind && termFillable(term, entry) ? 'fill' : 'present';
}

function eventState(event: AlbumEvent, existing: TimelineEvent | undefined): AlbumItemState {
	if (!existing) return 'new';
	return !filled(existing.description) && filled(event.description) ? 'fill' : 'present';
}

function authorFillable(author: AuthorDetails | undefined, value: AlbumValue): boolean {
	return (
		author !== undefined &&
		((author.birthYear === null && value.birthYear !== null) ||
			(author.deathYear === null && value.deathYear !== null) ||
			(!filled(author.country) && filled(value.country)))
	);
}

function locationFillable(location: LocationDetails | undefined, value: AlbumValue): boolean {
	return (
		location !== undefined &&
		((location.countryCode === null && value.countryCode !== null) ||
			(location.placeType === null && value.placeType !== null))
	);
}

function valueFillable(value: AlbumValue, details: ValueDetails): boolean {
	return (
		(!filled(details.summary) && filled(value.summary)) ||
		(!filled(details.notes) && filled(value.description)) ||
		authorFillable(details.author, value) ||
		locationFillable(details.location, value)
	);
}

export function hasNewDescription(value: AlbumValue, details: ValueDetails): boolean {
	return (
		filled(details.notes) &&
		filled(value.description) &&
		!details.notes.includes(value.description.trim())
	);
}

function valueState(value: AlbumValue, details: ValueDetails | undefined): AlbumItemState {
	if (!details) return 'new';
	if (hasNewDescription(value, details)) return 'description';
	return valueFillable(value, details) ? 'fill' : 'present';
}

function relatedSets(
	album: Album,
	savedEntryIds: readonly string[]
): { terms: Set<string>; events: Set<string>; values: Set<string> } {
	const saved = album.artworks.filter((artwork) => savedEntryIds.includes(artwork.id));
	return {
		terms: new Set(saved.flatMap((artwork) => artwork.termIds)),
		events: new Set(saved.flatMap((artwork) => artwork.eventIds)),
		values: new Set(saved.flatMap((artwork) => artwork.valueIds))
	};
}

function termItems(album: Album, matches: ItemMatches, related: Set<string>): AlbumItem[] {
	return album.terms.map((term) => {
		const existing = matches.entries.find((entry) =>
			namesOf(term).some((name) => sameName(entry.name, name))
		);
		return {
			kind: 'term',
			key: `term:${term.id}`,
			part: term.kind === 'figure' ? 'figures' : 'terms',
			title: term.name,
			excerpt: term.definition,
			state: termState(term, existing),
			related: related.has(term.id),
			term,
			existing
		};
	});
}

function eventItems(album: Album, matches: ItemMatches, related: Set<string>): AlbumItem[] {
	return album.events.map((event) => {
		const existing = matches.events.find((candidate) => sameName(candidate.name, event.name));
		return {
			kind: 'event',
			key: `event:${event.id}`,
			part: 'events',
			title: event.name,
			excerpt: [formatDate(event.yearFrom, event.yearTo, event.yearApproximate), event.description]
				.filter(Boolean)
				.join(': '),
			state: eventState(event, existing),
			related: related.has(event.id),
			event,
			existing
		};
	});
}

function valueItems(album: Album, matches: ItemMatches, related: Set<string>): AlbumItem[] {
	return album.values
		.filter(
			(value) =>
				DESCRIBED_CATEGORIES.has(value.category) &&
				(filled(value.summary) || filled(value.description))
		)
		.map((value) => {
			const record = matches.records.find(
				(candidate) =>
					candidate.category === value.category &&
					namesOf(value).some((name) => sameName(candidate.name, name))
			);
			const existingDetails = record ? matches.details[record.id] : undefined;
			return {
				kind: 'value',
				key: `value:${value.id}`,
				part: 'values',
				title: value.name,
				excerpt: value.summary ?? value.description,
				state: record && !existingDetails ? 'present' : valueState(value, existingDetails),
				related: related.has(value.id),
				value,
				record,
				existingDetails
			};
		});
}

export function albumItems(
	album: Album,
	matches: ItemMatches,
	savedEntryIds: readonly string[]
): AlbumItem[] {
	const related = relatedSets(album, savedEntryIds);
	return [
		...termItems(album, matches, related.terms),
		...eventItems(album, matches, related.events),
		...valueItems(album, matches, related.values)
	];
}

export function itemsOfPart(items: readonly AlbumItem[], part: AlbumItemPart): AlbumItem[] {
	return items.filter((item) => item.part === part);
}

export function selectableItem(item: AlbumItem): boolean {
	return item.state !== 'present';
}

export function startsSelected(item: AlbumItem): boolean {
	return item.related && selectableItem(item);
}
