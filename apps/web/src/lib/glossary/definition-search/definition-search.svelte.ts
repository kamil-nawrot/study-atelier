import { untrack } from 'svelte';
import { m } from '#lib/i18n/i18n.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
import type { WikipediaArticle } from '#lib/glossary/types/wikipedia-article.ts';
import { searchArticles, sourceOf } from '#lib/glossary/wikipedia/wikipedia.ts';

const SEARCH_DELAY_MS = 600;

type SearchStatus = 'idle' | 'searching' | 'found' | 'none' | 'failed';

function keyOf(name: string, category: string): string {
	return `${name.trim()}|${category}`;
}

export class DefinitionSearch {
	status = $state<SearchStatus>('idle');
	articles = $state<WikipediaArticle[]>([]);
	articlesOpen = $state(false);
	replaceOpen = $state(false);

	#autoFilled = $state<string | null>(null);
	#articlesKey = $state('');
	#pendingArticle = $state<WikipediaArticle>();
	#request = 0;
	readonly #form: () => GlossaryDraft;

	constructor(form: () => GlossaryDraft) {
		this.#form = form;
	}

	get form(): GlossaryDraft {
		return this.#form();
	}

	hint = $derived(
		this.status === 'none'
			? m.glossary.form.definitionNone
			: this.status === 'failed'
				? m.glossary.form.definitionFailed
				: undefined
	);
	placeholder = $derived(
		this.status === 'searching'
			? m.glossary.form.definitionSearching
			: autoFetch.definition
				? m.glossary.form.definitionPending
				: m.glossary.form.definitionManual
	);
	searchable = $derived(
		!autoFetch.definition &&
			this.status !== 'searching' &&
			this.status !== 'failed' &&
			!this.form.source &&
			this.form.name.trim() !== '' &&
			!!this.form.category
	);

	follow(): void {
		$effect(() => {
			const name = this.form.name.trim();
			const category = this.form.category;
			if (!name || !category || !autoFetch.definition) return;
			const timer = setTimeout(() => {
				if (untrack(() => this.#replaceable())) void this.search(true);
			}, SEARCH_DELAY_MS);
			return () => clearTimeout(timer);
		});
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
		if (!name || !category) return;
		const current = ++this.#request;
		this.status = 'searching';
		try {
			const found = await searchArticles(name, category);
			if (current !== this.#request) return;
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
			this.articles = [];
			this.#articlesKey = '';
			this.status = 'failed';
		}
	}

	async openArticles(): Promise<void> {
		this.articlesOpen = true;
		const { name, category } = this.form;
		if (category && this.#articlesKey === keyOf(name, category) && this.articles.length > 0) {
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
