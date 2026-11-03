import type { NoteLinkOption, NoteLinks, NoteLinkTrigger } from '@study-atelier/ui';
import { resolve } from '$app/paths';
import { ERA_CODES, isEraCode } from '#lib/catalogue/eras/eras.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { isValueKind, valueKindName, valuePath } from '#lib/card-index/value-pages/value-pages.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { NoteLinkSuggestionRow } from '#lib/notes/types/note-link-suggestion-row.ts';

type SearchNoteLinks = (trigger: NoteLinkTrigger, phrase: string) => Promise<NoteLinkOption[]>;

const SUGGESTION_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;
const TYPING_PAUSE_MS = 150;
const ARTWORK_HREF = /^\/atelier\/(\d+)$/;

function artworkHref(number: number): string {
	return resolve('/(app)/atelier/[number]', { number: String(number) });
}

function linkKey(href: string): string {
	const artwork = ARTWORK_HREF.exec(href);
	return artwork ? artworkHref(Number(artwork[1])) : href;
}

function rank(name: string, term: string): number {
	return normalizeForSearch(name).startsWith(term) ? 0 : 1;
}

function eraOptions(term: string): NoteLinkOption[] {
	return ERA_CODES.filter((code) => normalizeForSearch(m.eras[code].name).includes(term)).map(
		(code) => ({
			href: valuePath('era', code),
			name: m.eras[code].name,
			detail: valueKindName('era')
		})
	);
}

function parentName(kind: string, parent: string): string {
	return kind === 'period' && isEraCode(parent) ? m.eras[parent].name : parent;
}

export function suggestionOption(row: NoteLinkSuggestionRow): NoteLinkOption | undefined {
	if (row.kind === 'artwork' && row.record_number !== null) {
		return {
			href: artworkHref(row.record_number),
			name: `${formatRecordNumber(row.record_number)} ${row.title ?? ''}`,
			detail: row.authors.join(', ')
		};
	}
	if (!isValueKind(row.kind) || row.kind === 'era') return undefined;
	const kind = row.kind;
	return {
		href: valuePath(kind, row.id),
		name: row.title ?? '',
		detail: [valueKindName(kind), ...row.parents.map((parent) => parentName(kind, parent))].join(
			' · '
		)
	};
}

export function withEras(phrase: string, values: NoteLinkOption[]): NoteLinkOption[] {
	const term = normalizeForSearch(phrase);
	return [...eraOptions(term), ...values]
		.sort(
			(a, b) =>
				rank(a.name, term) - rank(b.name, term) ||
				normalizeForSearch(a.name).localeCompare(normalizeForSearch(b.name), 'pl', {
					sensitivity: 'base'
				})
		)
		.slice(0, SUGGESTION_LIMIT);
}

function typingPause(): Promise<void> {
	return new Promise((done) => setTimeout(done, TYPING_PAUSE_MS));
}

export function editorNoteLinks(
	search: SearchNoteLinks,
	labels: ReadonlyMap<string, string> = new Map()
): NoteLinks {
	const known = new Map(labels);
	let latest = 0;
	return {
		minQueryLength: MIN_QUERY_LENGTH,
		suggest: (trigger, query) => {
			const phrase = query.trim();
			if (phrase.length < MIN_QUERY_LENGTH) return [];
			const call = ++latest;
			return typingPause().then(async () => {
				if (call !== latest) return [];
				const options = await search(trigger, phrase);
				for (const option of options) known.set(option.href, option.name);
				return options;
			});
		},
		resolve: (href) => known.get(linkKey(href))
	};
}

export function labelledNoteLinks(labels: ReadonlyMap<string, string>): NoteLinks {
	return {
		minQueryLength: MIN_QUERY_LENGTH,
		suggest: (): NoteLinkOption[] => [],
		resolve: (href: string): string | undefined => labels.get(linkKey(href))
	};
}
