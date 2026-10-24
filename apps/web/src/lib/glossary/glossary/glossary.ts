import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { GlossaryCategory, GlossaryDraft, GlossaryEntry } from '#lib/glossary/types.ts';

export const GLOSSARY_SEARCH_MIN_ENTRIES = 20;
export const DEFINITION_MAX_LENGTH = 4000;
export const NAME_MAX_LENGTH = 120;
export const FORMS_MAX_COUNT = 50;
export const SYNONYMS_MAX_COUNT = 3;
export const SHORT_SENTENCE_WORDS = 3;

const collator = new Intl.Collator('pl');

const ABBREVIATIONS = new Set([
	'np',
	'tzw',
	'ok',
	'ur',
	'zm',
	'tj',
	'itd',
	'itp',
	'prof',
	'św',
	'wł',
	'właśc',
	'zw',
	'łac',
	'gr',
	'fr',
	'niem',
	'ang',
	'zob',
	'por',
	'wyd',
	'dr',
	'inż',
	'tys',
	'mln'
]);

export type LetterGroup = {
	letter: string;
	entries: GlossaryEntry[];
};

export function sortKeyOf(entry: GlossaryEntry): string {
	return entry.sortName ?? entry.name;
}

export function sortEntries(entries: readonly GlossaryEntry[]): GlossaryEntry[] {
	return [...entries].sort((a, b) => collator.compare(sortKeyOf(a), sortKeyOf(b)));
}

export function firstLetter(name: string): string {
	return (Array.from(name.trim())[0] ?? '').toLocaleUpperCase('pl');
}

export function groupByLetter(entries: readonly GlossaryEntry[]): LetterGroup[] {
	const groups: LetterGroup[] = [];
	for (const entry of sortEntries(entries)) {
		const letter = firstLetter(sortKeyOf(entry));
		const last = groups.at(-1);
		if (last && collator.compare(last.letter, letter) === 0) last.entries.push(entry);
		else groups.push({ letter, entries: [entry] });
	}
	return groups;
}

export function countByCategory(
	entries: readonly GlossaryEntry[]
): Record<GlossaryCategory, number> {
	const counts: Record<GlossaryCategory, number> = {
		person: 0,
		architecture: 0,
		painting: 0,
		sculpture: 0,
		technique: 0,
		general: 0
	};
	for (const entry of entries) counts[entry.category] += 1;
	return counts;
}

export function filterEntries(
	entries: readonly GlossaryEntry[],
	categories: ReadonlySet<GlossaryCategory>,
	query: string
): GlossaryEntry[] {
	const term = normalizeForSearch(query);
	return entries.filter(
		(entry) =>
			(categories.size === 0 || categories.has(entry.category)) &&
			(!term || normalizeForSearch(entry.name).includes(term))
	);
}

export function firstSentence(text: string): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	const ending = /[.!?…]+(?=\s|$)/g;
	for (let match = ending.exec(flat); match; match = ending.exec(flat)) {
		const end = match.index + match[0].length;
		const word = flat.slice(0, match.index).split(/[\s(]/).at(-1)?.toLocaleLowerCase('pl') ?? '';
		const next = flat.slice(end).trimStart().charAt(0);
		const initial = word.length === 1 && /\p{L}/u.test(word);
		const abbreviation = ABBREVIATIONS.has(word) || initial;
		if (end < flat.length && (abbreviation || /[\p{Ll}\d]/u.test(next))) continue;
		return flat.slice(0, end);
	}
	return flat;
}

export function isShortSentence(sentence: string): boolean {
	return sentence.split(' ').filter((word) => word !== '').length <= SHORT_SENTENCE_WORDS;
}

export function leadSentences(text: string): string {
	const first = firstSentence(text);
	if (!isShortSentence(first)) return first;
	const rest = text.replace(/\s+/g, ' ').trim().slice(first.length).trim();
	return rest ? `${first} ${firstSentence(rest)}` : first;
}

export function sameName(a: string, b: string): boolean {
	return normalizeForSearch(a) === normalizeForSearch(b);
}

export function findNameConflict(
	entries: readonly GlossaryEntry[],
	name: string,
	exceptId?: string
): GlossaryEntry | undefined {
	if (!name.trim()) return undefined;
	return entries.find((entry) => entry.id !== exceptId && sameName(entry.name, name));
}

export function cleanForms(forms: readonly string[]): string[] {
	const seen = new Set<string>();
	const cleaned: string[] = [];
	for (const form of forms) {
		const trimmed = form.replace(/\s+/g, ' ').trim();
		const key = trimmed.toLocaleLowerCase('pl');
		if (!trimmed || seen.has(key)) continue;
		seen.add(key);
		cleaned.push(trimmed);
	}
	return cleaned;
}

export function cappedForms(forms: readonly string[]): string[] {
	return cleanForms(forms).slice(0, FORMS_MAX_COUNT);
}

export function emptyDraft(): GlossaryDraft {
	return {
		name: '',
		category: null,
		definition: '',
		synonyms: [],
		forms: [],
		sortByOther: false,
		sortName: '',
		source: null
	};
}

export function draftOf(entry: GlossaryEntry): GlossaryDraft {
	return {
		name: entry.name,
		category: entry.category,
		definition: entry.definition,
		synonyms: [...entry.synonyms],
		forms: [...entry.forms],
		sortByOther: entry.sortName !== null,
		sortName: entry.sortName ?? '',
		source: entry.source ? { ...entry.source } : null
	};
}

export function sortNameOf(draft: GlossaryDraft): string | null {
	const sortName = draft.sortName.replace(/\s+/g, ' ').trim();
	return draft.sortByOther && sortName !== '' ? sortName : null;
}

export function draftChanged(current: GlossaryDraft, reference: GlossaryDraft): boolean {
	return (
		current.name.trim() !== reference.name.trim() ||
		current.category !== reference.category ||
		current.definition.trim() !== reference.definition.trim() ||
		JSON.stringify(cleanForms(current.synonyms)) !==
			JSON.stringify(cleanForms(reference.synonyms)) ||
		JSON.stringify(cleanForms(current.forms)) !== JSON.stringify(cleanForms(reference.forms)) ||
		sortNameOf(current) !== sortNameOf(reference) ||
		JSON.stringify(current.source) !== JSON.stringify(reference.source)
	);
}

export function authorNamed(index: CardIndexData, name: string): CardIndexRecord | undefined {
	if (!name.trim()) return undefined;
	return index.values.find((record) => record.category === 'author' && sameName(record.name, name));
}

export function shortenDefinition(text: string, max = DEFINITION_MAX_LENGTH): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
	return end > max / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, max - 1).trimEnd()}…`;
}
