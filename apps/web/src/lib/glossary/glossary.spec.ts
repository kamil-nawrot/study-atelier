import { describe, expect, it } from 'vitest';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testEntry, testGlossary } from '#lib/testing/glossary.ts';
import {
	authorNamed,
	cleanForms,
	countByCategory,
	draftChanged,
	draftOf,
	emptyDraft,
	filterEntries,
	findNameConflict,
	firstLetter,
	firstSentence,
	groupByLetter,
	shortenDefinition,
	sortEntries
} from './glossary.ts';

describe('sortEntries', () => {
	it('sorts by name in Polish alphabetical order', () => {
		const names = ['Zeus', 'Łuk', 'Lorenzo', 'Ćwiczenie', 'Abacus', 'Czas'].map((name, position) =>
			testEntry(String(position), name)
		);

		expect(sortEntries(names).map((entry) => entry.name)).toEqual([
			'Abacus',
			'Czas',
			'Ćwiczenie',
			'Lorenzo',
			'Łuk',
			'Zeus'
		]);
	});

	it('does not change the list it was given', () => {
		const entries = testGlossary();
		const before = entries.map((entry) => entry.name);

		sortEntries(entries);

		expect(entries.map((entry) => entry.name)).toEqual(before);
	});
});

describe('groupByLetter', () => {
	it('groups the entries under their capital first letters, each letter once', () => {
		const groups = groupByLetter(testGlossary());

		expect(groups.map((group) => group.letter)).toEqual(['A', 'C', 'F', 'L', 'Ł', 'T']);
		expect(groups[0].entries.map((entry) => entry.name)).toEqual(['Abacus']);
	});

	it('puts names that differ only in letter case under one letter', () => {
		const groups = groupByLetter([testEntry('1', 'apsyda'), testEntry('2', 'Abakus')]);

		expect(groups).toHaveLength(1);
		expect(groups[0].letter).toBe('A');
		expect(groups[0].entries.map((entry) => entry.name)).toEqual(['Abakus', 'apsyda']);
	});

	it('gives nothing for an empty list', () => {
		expect(groupByLetter([])).toEqual([]);
	});
});

describe('firstLetter', () => {
	it('upper-cases the first letter with Polish rules', () => {
		expect(firstLetter('łuk')).toBe('Ł');
		expect(firstLetter('  śnieg')).toBe('Ś');
		expect(firstLetter('')).toBe('');
	});
});

describe('countByCategory', () => {
	it('counts the entries of every category, also those without entries', () => {
		expect(countByCategory(testGlossary())).toEqual({
			person: 1,
			architecture: 3,
			painting: 1,
			sculpture: 0,
			technique: 1,
			general: 0
		});
	});
});

describe('filterEntries', () => {
	const entries = testGlossary();

	it('keeps everything without categories and a query', () => {
		expect(filterEntries(entries, new Set(), '')).toHaveLength(entries.length);
	});

	it('keeps the entries of the chosen categories', () => {
		const names = filterEntries(entries, new Set(['painting', 'person'] as const), '').map(
			(entry) => entry.name
		);

		expect(names).toEqual(['Chiaroscuro', 'Lorenzo Medici']);
	});

	it('finds a name by part of it, ignoring letter case and diacritics', () => {
		expect(filterEntries(entries, new Set(), 'luk').map((entry) => entry.name)).toEqual(['Łuk']);
		expect(filterEntries(entries, new Set(), 'TYMP').map((entry) => entry.name)).toEqual([
			'Tympanum'
		]);
	});

	it('combines the categories with the query', () => {
		expect(filterEntries(entries, new Set(['person'] as const), 'tymp')).toEqual([]);
	});
});

describe('firstSentence', () => {
	it('takes the text up to the first full stop', () => {
		expect(firstSentence('Jedno zdanie. Drugie zdanie.')).toBe('Jedno zdanie.');
	});

	it('keeps the whole text when it has one sentence or none ends', () => {
		expect(firstSentence('Bez kropki na końcu')).toBe('Bez kropki na końcu');
		expect(firstSentence('Jedno zdanie.')).toBe('Jedno zdanie.');
	});

	it('does not stop at an abbreviation or an initial', () => {
		expect(
			firstSentence('Rzeźba, np. Dawid Michała Anioła, stoi we Florencji. Kolejne zdanie.')
		).toBe('Rzeźba, np. Dawid Michała Anioła, stoi we Florencji.');
		expect(
			firstSentence('Giorgio Vasari (ur. 1511, zm. 1574) był malarzem. Pisał też książki.')
		).toBe('Giorgio Vasari (ur. 1511, zm. 1574) był malarzem.');
		expect(firstSentence('Leonardo da Vinci i M. Anioł tworzyli. Potem Rafael.')).toBe(
			'Leonardo da Vinci i M. Anioł tworzyli.'
		);
	});

	it('does not stop at a full stop followed by a number', () => {
		expect(firstSentence('Powstał ok. 1500 roku w Rzymie. Stoi do dziś.')).toBe(
			'Powstał ok. 1500 roku w Rzymie.'
		);
	});

	it('handles question marks, ellipses and line breaks', () => {
		expect(firstSentence('Czy to sztuka? Tak.')).toBe('Czy to sztuka?');
		expect(firstSentence('Pierwsza linia\nciąg dalszy. Następne.')).toBe(
			'Pierwsza linia ciąg dalszy.'
		);
		expect(firstSentence('')).toBe('');
	});
});

describe('findNameConflict', () => {
	const entries = testGlossary();

	it('finds an entry with the same name, ignoring letter case and diacritics', () => {
		expect(findNameConflict(entries, 'tympanum')?.id).toBe('a-tympanum');
		expect(findNameConflict(entries, 'LUK')?.id).toBe('a-lukowy');
	});

	it('ignores the entry being edited', () => {
		expect(findNameConflict(entries, 'Tympanum', 'a-tympanum')).toBeUndefined();
	});

	it('finds nothing for a new or an empty name', () => {
		expect(findNameConflict(entries, 'Sfumato')).toBeUndefined();
		expect(findNameConflict(entries, '   ')).toBeUndefined();
	});
});

describe('cleanForms', () => {
	it('trims the forms and drops empty ones and repeats', () => {
		expect(cleanForms([' tympana ', '', 'Tympana', 'tympanów', '  '])).toEqual([
			'tympana',
			'tympanów'
		]);
	});
});

describe('draftChanged', () => {
	const entry = testGlossary()[0];

	it('is false for a copy of the saved draft', () => {
		expect(draftChanged(draftOf(entry), draftOf(entry))).toBe(false);
	});

	it('ignores whitespace around the name and the definition and empty forms', () => {
		const current = draftOf(entry);
		current.name = ` ${entry.name} `;
		current.definition = `${entry.definition}  `;
		current.forms = [...entry.forms, ' '];

		expect(draftChanged(current, draftOf(entry))).toBe(false);
	});

	it('sees a changed field', () => {
		const reference = draftOf(entry);
		const renamed = { ...draftOf(entry), name: 'Other' };
		const recategorised = { ...draftOf(entry), category: 'general' as const };
		const rewritten = { ...draftOf(entry), definition: 'Other text' };
		const reformed = { ...draftOf(entry), forms: ['one'] };
		const unsourced = { ...draftOf(entry), source: null };

		for (const current of [renamed, recategorised, rewritten, reformed, unsourced]) {
			expect(draftChanged(current, reference)).toBe(true);
		}
	});

	it('starts empty for a new entry', () => {
		expect(draftChanged(emptyDraft(), emptyDraft())).toBe(false);
	});
});

describe('authorNamed', () => {
	it('finds the author of the card index with the same name, ignoring letter case', () => {
		expect(authorNamed(testCardIndex(), 'phidias')?.id).toBe('author-phidias');
	});

	it('ignores values that are not authors and empty names', () => {
		expect(authorNamed(testCardIndex(), 'Marble')).toBeUndefined();
		expect(authorNamed(testCardIndex(), '  ')).toBeUndefined();
	});
});

describe('shortenDefinition', () => {
	it('keeps a short text as it is', () => {
		expect(shortenDefinition('Short text.', 50)).toBe('Short text.');
	});

	it('cuts a long text after its last whole sentence that fits', () => {
		const text =
			'First sentence is here. Second sentence is also here. Third one goes too far away.';

		expect(shortenDefinition(text, 60)).toBe(
			'First sentence is here. Second sentence is also here.'
		);
	});

	it('cuts a long text without sentences with an ellipsis', () => {
		expect(shortenDefinition('word '.repeat(40), 30)).toMatch(/^(word ){5}word…$/);
	});
});
