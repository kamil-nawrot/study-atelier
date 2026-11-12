import { vi } from 'vitest';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

type Suggested = {
	categoryValues?: CategoryValues;
	ownValues?: Record<string, string[]>;
	valueLinks?: ValueLinks;
	placeStarter?: PlaceStarter;
	glossary?: GlossaryTerm[];
};

export const suggested: Suggested = {};

export const suggestionLoads = vi.fn(() => Promise.resolve());

export class FakeFormSuggestions {
	categoryValues = suggested.categoryValues ?? emptyCategoryValues();
	ownValues = suggested.ownValues ?? {};
	valueLinks = suggested.valueLinks ?? emptyValueLinks();
	placeStarter = suggested.placeStarter ?? emptyPlaceStarter();
	glossary: GlossaryTerm[];
	symbols = [];
	noteLinks = undefined;

	constructor({ glossary }: { glossary?: GlossaryTerm[] } = {}) {
		this.glossary = glossary ?? suggested.glossary ?? [];
	}

	load(): Promise<void> {
		return suggestionLoads();
	}
}

export function suggest(next: Suggested): void {
	for (const key of Object.keys(suggested) as (keyof Suggested)[]) delete suggested[key];
	Object.assign(suggested, next);
}
