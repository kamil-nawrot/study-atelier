import type { NoteLinkOption, NoteLinks, NoteLinkTrigger } from '@study-atelier/ui';
import { resolve } from '$app/paths';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import {
	findSubject,
	subjectName,
	subjectPath,
	valueKindName,
	valueParents
} from '#lib/card-index/value-pages/value-pages.ts';

const SUGGESTION_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;

export type NoteLinkArtwork = {
	number: number;
	title: string;
	authors: string[];
};

export type NoteLinkSources = {
	index: CardIndexData;
	artworks: NoteLinkArtwork[];
};

type Candidate = {
	option: NoteLinkOption;
	key: string;
	number?: number;
};

function valueCandidates(index: CardIndexData): Candidate[] {
	const subjects: ValueSubject[] = [
		...ERA_CODES.map((code): ValueSubject => ({ kind: 'era', code })),
		...index.values.map((record): ValueSubject => ({ kind: record.category, record }))
	];
	return subjects.map((subject) => {
		const name = subjectName(subject);
		const parents = valueParents(index, subject).map((parent) => parent.name);
		return {
			option: {
				href: subjectPath(subject),
				name,
				detail: [valueKindName(subject.kind), ...parents].join(' · ')
			},
			key: normalizeForSearch(name)
		};
	});
}

function artworkCandidates(artworks: NoteLinkArtwork[]): Candidate[] {
	return artworks.map((artwork) => ({
		option: {
			href: resolve('/(app)/atelier/[number]', { number: String(artwork.number) }),
			name: `${formatRecordNumber(artwork.number)} ${artwork.title}`,
			detail: artwork.authors.join(', ')
		},
		key: normalizeForSearch(`${artwork.title} ${artwork.authors.join(' ')}`),
		number: artwork.number
	}));
}

function rank(candidate: Candidate, term: string): number {
	if (candidate.key.startsWith(term)) return 0;
	if (candidate.key.includes(term)) return 1;
	return 2;
}

function matchValues(candidates: Candidate[], query: string): NoteLinkOption[] {
	const term = normalizeForSearch(query);
	return candidates
		.filter((candidate) => term === '' || candidate.key.includes(term))
		.sort(
			(a, b) =>
				rank(a, term) - rank(b, term) || a.key.localeCompare(b.key, 'pl', { sensitivity: 'base' })
		)
		.slice(0, SUGGESTION_LIMIT)
		.map((candidate) => candidate.option);
}

function matchArtworks(candidates: Candidate[], query: string): NoteLinkOption[] {
	const term = normalizeForSearch(query);
	const digits = /^\d+$/.test(term) ? String(Number(term)) : null;
	const numbered = (candidate: Candidate): boolean =>
		digits !== null && String(candidate.number).startsWith(digits);
	return candidates
		.filter((candidate) => term === '' || numbered(candidate) || candidate.key.includes(term))
		.sort((a, b) => {
			if (numbered(a) !== numbered(b)) return numbered(a) ? -1 : 1;
			if (numbered(a)) return (a.number as number) - (b.number as number);
			return rank(a, term) - rank(b, term) || (b.number as number) - (a.number as number);
		})
		.slice(0, SUGGESTION_LIMIT)
		.map((candidate) => candidate.option);
}

function resolveValue(index: CardIndexData, kind: string, id: string): string | undefined {
	const subject = findSubject(index, kind, id);
	return subject && subjectName(subject);
}

export function buildNoteLinks(sources: NoteLinkSources): NoteLinks {
	const values = valueCandidates(sources.index);
	const artworks = artworkCandidates(sources.artworks);
	const artworkNames = new Map(
		sources.artworks.map((artwork) => [
			String(artwork.number),
			`${formatRecordNumber(artwork.number)} ${artwork.title}`
		])
	);

	return {
		minQueryLength: MIN_QUERY_LENGTH,
		suggest: (trigger: NoteLinkTrigger, query: string): NoteLinkOption[] =>
			trigger === '@' ? matchValues(values, query) : matchArtworks(artworks, query),
		resolve: (href: string): string | undefined => {
			const artwork = /^\/atelier\/(\d+)$/.exec(href);
			if (artwork) return artworkNames.get(String(Number(artwork[1])));
			const value = /^\/atelier\/values\/([a-z]+)\/([A-Za-z0-9_-]+)$/.exec(href);
			return value ? resolveValue(sources.index, value[1], value[2]) : undefined;
		}
	};
}
