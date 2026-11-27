import { emptyDraft, draftOf } from '#lib/glossary/glossary/glossary.ts';
import { emptyAuthorDetails, lifeFormFromYears } from '#lib/values/author-form/author-form.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import type { AlbumEvent } from '#lib/albums/types/album-event.ts';
import type { AlbumTerm } from '#lib/albums/types/album-term.ts';
import type { AlbumTextSource } from '#lib/albums/types/album-text-source.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { AuthorDetails } from '#lib/values/types/author-details.ts';
import type { LocationDetails } from '#lib/values/types/location-details.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

type ValueDrafts = {
	subject: ValueSubject;
	baseline: ValueDetails;
	prefill: ValueDetails;
	appendNote?: string;
};

function sourceOf(source: AlbumTextSource | null, today: string): WikipediaSource | null {
	return source ? { ...source, fetchedOn: today } : null;
}

function filled(text: string | null | undefined): text is string {
	return (text ?? '').trim() !== '';
}

function figureFrom(base: GlossaryDraft, term: AlbumTerm): GlossaryDraft['figure'] {
	const years = lifeFormFromYears(term.birthYear, term.deathYear, term.yearsApproximate);
	const bornAlready = base.figure.birthYear !== '';
	const diedAlready = base.figure.deathYear !== '';
	return {
		...base.figure,
		birthYear: bornAlready ? base.figure.birthYear : years.birthYear,
		birthBeforeCommonEra: bornAlready
			? base.figure.birthBeforeCommonEra
			: years.birthBeforeCommonEra,
		deathYear: diedAlready ? base.figure.deathYear : years.deathYear,
		deathBeforeCommonEra: diedAlready
			? base.figure.deathBeforeCommonEra
			: years.deathBeforeCommonEra,
		yearsApproximate:
			bornAlready || diedAlready ? base.figure.yearsApproximate : years.yearsApproximate,
		country: filled(base.figure.country) ? base.figure.country : (term.country ?? '')
	};
}

export function termDraft(
	term: AlbumTerm,
	existing: GlossaryEntry | undefined,
	today: string
): GlossaryDraft {
	const base = existing ? draftOf(existing) : emptyDraft(term.kind);
	const definitionTaken = !filled(base.definition) && filled(term.definition);
	return {
		...base,
		name: existing ? base.name : term.name,
		category: base.category ?? term.category,
		definition: definitionTaken ? (term.definition ?? '') : base.definition,
		synonyms: base.synonyms.length > 0 ? base.synonyms : [...term.alternativeNames],
		source: definitionTaken ? sourceOf(term.source, today) : base.source,
		figure: term.kind === 'figure' ? figureFrom(base, term) : base.figure
	};
}

export function eventPrefill(
	event: AlbumEvent,
	existing: TimelineEvent | undefined,
	today: string
): TimelineEvent {
	if (existing) {
		const descriptionTaken = !filled(existing.description) && filled(event.description);
		return {
			...existing,
			description: descriptionTaken ? (event.description ?? '') : existing.description,
			source: descriptionTaken ? sourceOf(event.source, today) : existing.source
		};
	}
	return {
		id: '',
		name: event.name,
		yearFrom: event.yearFrom,
		yearTo: event.yearTo,
		yearApproximate: event.yearApproximate,
		description: event.description ?? '',
		source: sourceOf(event.source, today)
	};
}

function albumDetails(value: AlbumValue): ValueDetails {
	const details: ValueDetails = {
		summary: value.summary ?? '',
		notes: value.description ?? ''
	};
	if (value.category === 'author') {
		details.author = {
			...emptyAuthorDetails(),
			birthYear: value.birthYear,
			deathYear: value.deathYear,
			yearsApproximate: value.yearsApproximate,
			country: value.country
		};
	}
	if (value.category === 'location') {
		details.location = { countryCode: value.countryCode, placeType: value.placeType };
	}
	return details;
}

function mergedAuthor(author: AuthorDetails, album: AuthorDetails | undefined): AuthorDetails {
	const noYears = author.birthYear === null && author.deathYear === null;
	return {
		...author,
		birthYear: author.birthYear ?? album?.birthYear ?? null,
		deathYear: author.deathYear ?? album?.deathYear ?? null,
		yearsApproximate: noYears ? (album?.yearsApproximate ?? false) : author.yearsApproximate,
		country: filled(author.country) ? author.country : (album?.country ?? null)
	};
}

function mergedLocation(
	location: LocationDetails,
	album: LocationDetails | undefined
): LocationDetails {
	return {
		...location,
		countryCode: location.countryCode ?? album?.countryCode ?? null,
		placeType: location.placeType ?? album?.placeType ?? null
	};
}

function mergedDetails(value: AlbumValue, own: ValueDetails): ValueDetails {
	const album = albumDetails(value);
	return {
		summary: filled(own.summary) ? own.summary : album.summary,
		notes: filled(own.notes) ? own.notes : album.notes,
		...(own.author ? { author: mergedAuthor(own.author, album.author) } : {}),
		...(own.location ? { location: mergedLocation(own.location, album.location) } : {})
	};
}

export function valueDrafts(
	value: AlbumValue,
	record: CardIndexRecord | undefined,
	existing: ValueDetails | undefined,
	newNoteText: boolean
): ValueDrafts {
	if (!record || !existing) {
		const empty = emptyValueDetails();
		return {
			subject: {
				kind: value.category,
				record: { id: '', category: value.category, name: value.name, count: 0 }
			},
			baseline: {
				...empty,
				...(value.category === 'author' ? { author: emptyAuthorDetails() } : {}),
				...(value.category === 'location'
					? { location: { countryCode: null, placeType: null } }
					: {})
			},
			prefill: albumDetails(value)
		};
	}
	return {
		subject: { kind: value.category, record },
		baseline: existing,
		prefill: mergedDetails(value, existing),
		...(newNoteText && filled(value.description) ? { appendNote: value.description.trim() } : {})
	};
}
