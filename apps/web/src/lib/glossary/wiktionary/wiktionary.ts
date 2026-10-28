import { fetchJson, withDeadline } from '#lib/images/wikimedia/wikimedia.ts';
import { cleanForms } from '#lib/glossary/glossary/glossary.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';

const WIKTIONARY_API = 'https://pl.wiktionary.org/w/api.php';
const NOUN_TEMPLATE = 'odmiana-rzeczownik-polski';
const ADJECTIVE_TEMPLATE = 'odmiana-przymiotnik-polski';
const MAX_WORDS = 2;

const CASES = [
	'mianownik',
	'dopełniacz',
	'celownik',
	'biernik',
	'narzędnik',
	'miejscownik',
	'wołacz'
] as const;

type Case = (typeof CASES)[number];
type GrammaticalNumber = 'lp' | 'lm';
type Gender = 'mos' | 'mzw' | 'mrz' | 'ż' | 'n';

type Declension = Map<string, string[]>;

type Noun = {
	forms: Declension;
	gender: Gender | null;
};

type ParseResponse = { parse?: { wikitext?: string }; error?: { code?: string } };
type ExpandResponse = { expandtemplates?: { wikitext?: string } };

const GENDERS: Record<string, Gender> = {
	męskoosobowy: 'mos',
	męskozwierzęcy: 'mzw',
	męskorzeczowy: 'mrz',
	żeński: 'ż',
	nijaki: 'n'
};

const SINGULAR_COLUMN: Record<Gender, number> = { mos: 0, mzw: 0, mrz: 1, ż: 2, n: 3 };

function wiktionaryUrl(parameters: Record<string, string>): string {
	const query = new URLSearchParams({
		format: 'json',
		formatversion: '2',
		origin: '*',
		...parameters
	});
	return `${WIKTIONARY_API}?${query}`;
}

function key(grammaticalCase: Case, number: GrammaticalNumber): string {
	return `${grammaticalCase} ${number}`;
}

function wordsOf(name: string): string[] {
	return name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

export function suggestsForms(name: string, category: GlossaryCategory | null): boolean {
	const count = wordsOf(name).length;
	return category !== null && category !== 'person' && count > 0 && count <= MAX_WORDS;
}

export function polishSection(wikitext: string): string {
	const start = /^==\s*[^=\n]*\(\{\{język polski\}\}\)\s*==\s*$/m.exec(wikitext);
	if (!start) return '';
	const rest = wikitext.slice(start.index + start[0].length);
	const end = /^==[^=]/m.exec(rest);
	return end ? rest.slice(0, end.index) : rest;
}

function templateBodies(text: string, name: string): string[] {
	const bodies: string[] = [];
	const opening = `{{${name}`;
	for (let start = text.indexOf(opening); start !== -1; start = text.indexOf(opening, start + 1)) {
		let depth = 0;
		for (let index = start; index < text.length - 1; index += 1) {
			const pair = text.slice(index, index + 2);
			if (pair === '{{') {
				depth += 1;
				index += 1;
			} else if (pair === '}}') {
				depth -= 1;
				index += 1;
				if (depth === 0) {
					bodies.push(text.slice(start + opening.length, index - 1));
					break;
				}
			}
		}
	}
	return bodies;
}

function topLevelParts(body: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = '';
	for (let index = 0; index < body.length; index += 1) {
		const pair = body.slice(index, index + 2);
		if (pair === '{{' || pair === '[[') {
			depth += 1;
			current += pair;
			index += 1;
		} else if ((pair === '}}' || pair === ']]') && depth > 0) {
			depth -= 1;
			current += pair;
			index += 1;
		} else if (body[index] === '|' && depth === 0) {
			parts.push(current);
			current = '';
		} else {
			current += body[index];
		}
	}
	parts.push(current);
	return parts;
}

function cleanValue(value: string): string[] {
	const text = value
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<ref[^>]*\/>/g, '')
		.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
		.replace(/\{\{[^{}]*\}\}/g, '')
		.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/'{2,}/g, '');
	return text
		.split('/')
		.map((form) => form.replace(/\s+/g, ' ').trim())
		.filter((form) => form !== '' && !/[{}[\]<>=|]/.test(form));
}

export function nounDeclensions(section: string): Declension[] {
	return templateBodies(section, NOUN_TEMPLATE).map((body) => {
		const declension: Declension = new Map();
		for (const part of topLevelParts(body)) {
			const match = /^\s*(\p{L}+)\s+(lp|lm)\s*=([\s\S]*)$/u.exec(part);
			if (!match) continue;
			const grammaticalCase = match[1].toLocaleLowerCase('pl');
			if (!(CASES as readonly string[]).includes(grammaticalCase)) continue;
			const id = key(grammaticalCase as Case, match[2] as GrammaticalNumber);
			declension.set(id, [...(declension.get(id) ?? []), ...cleanValue(match[3])]);
		}
		return declension;
	});
}

export function nounGender(section: string): Gender | null {
	const match = /rzeczownik,\s*rodzaj\s+(\p{L}+)/u.exec(section);
	return match ? (GENDERS[match[1]] ?? null) : null;
}

export function formsOfPage(section: string): string[] {
	return nounDeclensions(section).flatMap((declension) => [...declension.values()].flat());
}

export function nounOf(section: string, word: string): Noun | undefined {
	const lower = word.toLocaleLowerCase('pl');
	const forms = nounDeclensions(section).find((declension) =>
		declension.get(key('mianownik', 'lp'))?.some((form) => form.toLocaleLowerCase('pl') === lower)
	);
	return forms ? { forms, gender: nounGender(section) } : undefined;
}

function cellText(cell: string): string {
	return cell
		.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function adjectiveTable(html: string): Map<Case, string[]> {
	const table = new Map<Case, string[]>();
	for (const row of html.split(/<tr[^>]*>/).slice(1)) {
		const cells = [...row.matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)];
		const label = cellText(cells[0]?.[2] ?? '').toLocaleLowerCase('pl');
		if (!(CASES as readonly string[]).includes(label)) continue;
		const columns = cells.slice(1).flatMap(([, attributes, content]) => {
			const span = Number(/colspan="(\d+)"/.exec(attributes)?.[1] ?? '1');
			return Array.from({ length: span }, () => cellText(content));
		});
		table.set(label as Case, columns);
	}
	return table;
}

export function adjectiveForm(
	table: Map<Case, string[]>,
	grammaticalCase: Case,
	number: GrammaticalNumber,
	gender: Gender
): string | undefined {
	const column = number === 'lp' ? SINGULAR_COLUMN[gender] : gender === 'mos' ? 4 : 5;
	return table.get(grammaticalCase)?.[column] || undefined;
}

export function combinePhrase(
	noun: Noun,
	adjective: Map<Case, string[]>,
	adjectiveWord: string,
	adjectiveFirst: boolean
): string[] {
	const gender = noun.gender;
	if (!gender) return [];
	const base = adjectiveForm(adjective, 'mianownik', 'lp', gender);
	if (base?.toLocaleLowerCase('pl') !== adjectiveWord.toLocaleLowerCase('pl')) return [];
	const phrases: string[] = [];
	for (const number of ['lp', 'lm'] as const) {
		for (const grammaticalCase of CASES) {
			const adjectiveText = adjectiveForm(adjective, grammaticalCase, number, gender);
			if (!adjectiveText) continue;
			for (const nounText of noun.forms.get(key(grammaticalCase, number)) ?? []) {
				phrases.push(
					adjectiveFirst ? `${adjectiveText} ${nounText}` : `${nounText} ${adjectiveText}`
				);
			}
		}
	}
	return phrases;
}

export function lemmaCandidates(word: string): string[] {
	const lower = word.toLocaleLowerCase('pl');
	const stem = /[aeiyąo]$/u.test(lower) ? lower.slice(0, -1) : lower;
	return [...new Set([lower, `${stem}y`, `${stem}i`])];
}

async function sectionOf(title: string): Promise<string> {
	const response = await fetchJson<ParseResponse>(
		wiktionaryUrl({ action: 'parse', page: title, prop: 'wikitext', redirects: '1' })
	);
	return polishSection(response.parse?.wikitext ?? '');
}

async function adjectiveOf(word: string): Promise<Map<Case, string[]> | undefined> {
	for (const lemma of lemmaCandidates(word)) {
		const section = await sectionOf(lemma);
		if (!section.includes(`{{${ADJECTIVE_TEMPLATE}`)) continue;
		const response = await fetchJson<ExpandResponse>(
			wiktionaryUrl({
				action: 'expandtemplates',
				title: lemma,
				text: `{{${ADJECTIVE_TEMPLATE}}}`,
				prop: 'wikitext'
			})
		);
		const table = adjectiveTable(response.expandtemplates?.wikitext ?? '');
		if (table.size > 0) return table;
	}
	return undefined;
}

async function twoWordForms(first: string, second: string): Promise<string[]> {
	for (const [nounWord, adjectiveWord, adjectiveFirst] of [
		[first, second, false],
		[second, first, true]
	] as const) {
		const noun = nounOf(await sectionOf(nounWord.toLocaleLowerCase('pl')), nounWord);
		if (!noun) continue;
		const adjective = await adjectiveOf(adjectiveWord);
		if (adjective) return combinePhrase(noun, adjective, adjectiveWord, adjectiveFirst);
	}
	return [];
}

export function fetchForms(name: string): Promise<string[]> {
	return withDeadline(findForms(name));
}

async function findForms(name: string): Promise<string[]> {
	const words = wordsOf(name);
	const phrase = words.join(' ');
	let forms = formsOfPage(await sectionOf(phrase.toLocaleLowerCase('pl')));
	if (forms.length === 0 && words.length === 2) forms = await twoWordForms(words[0], words[1]);
	const lowerName = phrase.toLocaleLowerCase('pl');
	return cleanForms(forms).filter((form) => form.toLocaleLowerCase('pl') !== lowerName);
}
