import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadCategoryValues } from '#lib/card-index/category-values-data/category-values-data.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import { loadValueLinks } from '#lib/card-index/value-links-data/value-links-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { cached } from '#lib/shared/data/data-cache/data-cache.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { NoteLinks } from '@study-atelier/ui';

type Preloaded = {
	glossary?: GlossaryEntry[];
	noteLinks?: NoteLinks;
};

export class FormSuggestions {
	categoryValues = $state.raw<CategoryValues>(emptyCategoryValues());
	ownValues = $state.raw<Record<string, string[]>>({});
	valueLinks = $state.raw<ValueLinks>(emptyValueLinks());
	placeStarter = $state.raw<PlaceStarter>(emptyPlaceStarter());
	glossary = $state.raw<GlossaryEntry[]>([]);
	noteLinks = $state.raw<NoteLinks>();

	#loading: Promise<void> | undefined;

	constructor({ glossary, noteLinks }: Preloaded = {}) {
		this.glossary = glossary ?? [];
		this.noteLinks = noteLinks;
	}

	load(): Promise<void> {
		this.#loading ??= this.#loadAll();
		return this.#loading;
	}

	async #loadAll(): Promise<void> {
		const [categories, linked, starter, glossary, noteLinks] = await Promise.all([
			cached('category-values', loadCategoryValues),
			cached('value-links', loadValueLinks),
			loadPlaceStarter(),
			cached('glossary', loadGlossary),
			this.noteLinks ?? loadNoteLinks()
		]);
		this.categoryValues = categories.values;
		this.ownValues = categories.ownValues;
		this.valueLinks = linked.links;
		this.placeStarter = starter;
		if (!glossary.error) this.glossary = glossary.entries;
		this.noteLinks = noteLinks;
		if (categories.error || linked.error || glossary.error || !noteLinks) this.#loading = undefined;
	}
}
