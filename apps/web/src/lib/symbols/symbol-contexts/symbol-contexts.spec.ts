import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
import {
	contextKindName,
	contextLabel,
	contextOf,
	contextsOf,
	contextWrite,
	suggestContexts,
	type ContextRow
} from './symbol-contexts.ts';

const EMPTY_ROW: ContextRow = {
	position: 0,
	value_id: null,
	era_code: null,
	artwork_id: null,
	glossary_entry_id: null,
	text: null,
	category_values: null,
	artworks: null,
	glossary_entries: null
};

const baroque: SymbolContext = { kind: 'value', valueId: 'v1', category: 'period', name: 'Barok' };
const baroqueStyle: SymbolContext = {
	kind: 'value',
	valueId: 'v2',
	category: 'style',
	name: 'Barok'
};
const peter: SymbolContext = { kind: 'person', entryId: 'p1', name: 'Św. Piotr' };
const earlyModern: SymbolContext = { kind: 'era', eraCode: 'early_modern', name: 'nowożytność' };

describe('contextOf', () => {
	it('reads each kind of label', () => {
		expect(
			contextOf({
				...EMPTY_ROW,
				value_id: 'v1',
				category_values: { category_code: 'period', name: 'Barok' }
			})
		).toEqual(baroque);
		expect(contextOf({ ...EMPTY_ROW, era_code: 'early_modern' })).toEqual({
			kind: 'era',
			eraCode: 'early_modern',
			name: m.eras.early_modern.name
		});
		expect(
			contextOf({
				...EMPTY_ROW,
				artwork_id: 'a1',
				artworks: { record_number: 12, title: 'Ambasadorowie' }
			})
		).toEqual({ kind: 'artwork', artworkId: 'a1', number: 12, name: 'Ambasadorowie' });
		expect(
			contextOf({ ...EMPTY_ROW, glossary_entry_id: 'p1', glossary_entries: { name: 'Św. Piotr' } })
		).toEqual(peter);
		expect(contextOf({ ...EMPTY_ROW, text: 'heraldyka' })).toEqual({
			kind: 'text',
			name: 'heraldyka'
		});
	});

	it('keeps the name of a value of an own field as free text', () => {
		expect(
			contextOf({
				...EMPTY_ROW,
				value_id: 'v9',
				category_values: { category_code: 'field-1', name: 'Wykład 3' }
			})
		).toEqual({ kind: 'text', name: 'Wykład 3' });
	});
});

describe('contextWrite', () => {
	it('writes one target per label', () => {
		expect(contextWrite(baroque)).toEqual({ value_id: 'v1' });
		expect(contextWrite(earlyModern)).toEqual({ era_code: 'early_modern' });
		expect(contextWrite({ kind: 'artwork', artworkId: 'a1', number: 1, name: 'x' })).toEqual({
			artwork_id: 'a1'
		});
		expect(contextWrite(peter)).toEqual({ glossary_entry_id: 'p1' });
		expect(contextWrite({ kind: 'text', name: ' heraldyka ' })).toEqual({ text: 'heraldyka' });
	});
});

describe('labels', () => {
	it('names the kind of a label, but not of free text', () => {
		expect(contextKindName(baroqueStyle)).toBe(m.symbols.contextKinds.style);
		expect(contextKindName(peter)).toBe(m.symbols.contextKinds.person);
		expect(contextLabel(peter)).toBe(`Św. Piotr · ${m.symbols.contextKinds.person}`);
		expect(contextLabel({ kind: 'text', name: 'heraldyka' })).toBe('heraldyka');
	});

	it('turns chosen labels back into contexts, and unknown ones into free text', () => {
		expect(contextsOf([contextLabel(baroqueStyle), 'heraldyka'], [baroque, baroqueStyle])).toEqual([
			baroqueStyle,
			{ kind: 'text', name: 'heraldyka' }
		]);
	});
});

describe('suggestContexts', () => {
	const candidates = [baroque, baroqueStyle, peter, earlyModern];

	it('suggests nothing before the learner types', () => {
		expect(suggestContexts(candidates, [], ' ')).toEqual([]);
	});

	it('suggests matching labels of every kind, then the typed text as free text', () => {
		expect(suggestContexts(candidates, [], 'baro')).toEqual([
			{ kind: 'existing', name: contextLabel(baroque) },
			{ kind: 'existing', name: contextLabel(baroqueStyle) },
			{ kind: 'new', name: 'baro' }
		]);
	});

	it('leaves out chosen labels and offers no free text equal to a known name', () => {
		expect(suggestContexts(candidates, [baroque], 'barok')).toEqual([
			{ kind: 'existing', name: contextLabel(baroqueStyle) }
		]);
	});

	it('puts the names that start with the text first', () => {
		const options = suggestContexts(
			[
				{ kind: 'text', name: 'Stary Piotr' },
				peter,
				{ kind: 'person', entryId: 'p2', name: 'Piotr' }
			],
			[],
			'piotr'
		);
		expect(options[0].name).toContain('Piotr ·');
	});

	it('offers no free text longer than a label may be', () => {
		expect(suggestContexts([], [], 'a'.repeat(81))).toEqual([]);
	});
});
