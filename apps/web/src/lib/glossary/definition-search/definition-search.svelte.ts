import { untrack } from 'svelte';
import { m } from '#lib/i18n/i18n.ts';
import { glossaryFormTexts } from '#lib/glossary/form-texts/form-texts.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
import type { WikipediaArticle } from '#lib/glossary/types/wikipedia-article.ts';
import { searchArticles, sourceOf } from '#lib/glossary/wikipedia/wikipedia.ts';

const SEARCH_DELAY_MS = 600;

type SearchStatus = 'idle' | 'searching' | 'found' | 'none' | 'failed';

function keyOf(name: string, category: string | null): string {
	return `${name.trim()}|${category ?? ''}`;
}

export class DefinitionSearch {
	status = $state<SearchStatus>('idle');
	articles = $state<WikipediaArticle[]>([]);
	articlesOpen = $state(false);
	replaceOpen = $state(false);

	#autoFilled = $state<string | null>(null);
	#filling = $state(false);
	#stoppedKey = '';
	#articlesKey = $state('');
	#pendingArticle = $state<WikipediaArticle>();
	#request = 0;
	readonly #form: () => GlossaryDraft;
	readonly #figure: () => boolean;

	constructor(form: () => GlossaryDraft, figure: () => boolean = () => false) {
		this.#form = form;
		this.#figure = figure;
	}

	get figure(): boolean {
		return this.#figure();
	}

	get texts(): typeof m.glossary.form {
		return glossaryFormTexts(this.figure);
	}

	get form(): GlossaryDraft {
		return this.#form();
	}

	hint = $derived(
		this.status === 'none'
			? this.texts.definitionNone
			: this.status === 'failed'
				? this.texts.definitionFailed
				: undefined
	);
	filling = $derived(this.status === 'searching' && this.#filling);
	placeholder = $derived(
		this.filling
			? undefined
			: autoFetch.definition
				? this.texts.definitionPending
				: this.texts.definitionManual
	);
	searchable = $derived(
		!autoFetch.definition &&
			this.status !== 'searching' &&
			this.status !== 'failed' &&
			!this.form.source &&
			this.form.name.trim() !== ''
	);

	follow(): void {
		$effect(() => {
			const name = this.form.name.trim();
			const category = this.form.category;
			untrack(() => this.#cancelFilling());
			if (!name || !autoFetch.definition) return;
			if (keyOf(name, category) === this.#stoppedKey) return;
			const timer = setTimeout(() => {
				if (untrack(() => this.#replaceable())) void this.search(true);
			}, SEARCH_DELAY_MS);
			return () => clearTimeout(timer);
		});
	}

	#cancelFilling(): void {
		if (!this.filling) return;
		this.#request += 1;
		this.#filling = false;
		this.status = 'idle';
	}

	stop(): void {
		this.#stoppedKey = keyOf(this.form.name, this.form.category);
		this.#cancelFilling();
	}

	#replaceable(): boolean {
		return this.form.definition === '' || this.form.definition === this.#autoFilled;
	}

	#apply(article: WikipediaArticle): void {
		this.form.definition = article.extract;
		this.form.source = sourceOf(article);
		this.#autoFilled = article.extract;
	}

	async search(fill: boolean): Promise<void> {
		const name = this.form.name.trim();
		const category = this.form.category;
		if (!name) return;
		const current = ++this.#request;
		this.status = 'searching';
		this.#filling = fill && this.#replaceable();
		try {
			const found = await searchArticles(name, category);
			if (current !== this.#request) return;
			this.#filling = false;
			this.articles = found;
			this.#articlesKey = keyOf(name, category);
			this.status = found.length > 0 ? 'found' : 'none';
			if (!fill) return;
			if (found.length > 0) {
				if (this.#replaceable()) this.#apply(found[0]);
			} else if (this.form.definition !== '' && this.form.definition === this.#autoFilled) {
				this.form.definition = '';
				this.form.source = null;
				this.#autoFilled = null;
			}
		} catch {
			if (current !== this.#request) return;
			this.#filling = false;
			this.articles = [];
			this.#articlesKey = '';
			this.status = 'failed';
		}
	}

	async openArticles(): Promise<void> {
		this.articlesOpen = true;
		const { name, category } = this.form;
		if (this.#articlesKey === keyOf(name, category) && this.articles.length > 0) {
			this.status = 'found';
			return;
		}
		await this.search(false);
	}

	use(article: WikipediaArticle): void {
		this.articlesOpen = false;
		if (this.#replaceable() || this.form.definition === article.extract) {
			this.#apply(article);
			return;
		}
		this.#pendingArticle = article;
		this.replaceOpen = true;
	}

	confirmReplace(): void {
		if (this.#pendingArticle) this.#apply(this.#pendingArticle);
		this.#pendingArticle = undefined;
		this.replaceOpen = false;
	}

	removeSource(): void {
		this.form.source = null;
		this.#autoFilled = null;
	}
}
