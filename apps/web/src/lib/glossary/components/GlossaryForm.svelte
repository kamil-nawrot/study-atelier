<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		Form,
		FormActions,
		TextArea,
		TextButton,
		TextField,
		ValueField,
		type ValueOption
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/index.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import { autoFetch } from '#lib/profile/auto-fetch.svelte.ts';
	import { resolve } from '$app/paths';
	import {
		glossaryCategoryName,
		glossaryCategoryTiles,
		isGlossaryCategory
	} from '#lib/glossary/categories.ts';
	import { saveGlossaryEntry } from '#lib/glossary/glossary-data.ts';
	import {
		authorNamed,
		cappedForms,
		cleanForms,
		DEFINITION_MAX_LENGTH,
		draftChanged,
		draftOf,
		emptyDraft,
		findNameConflict,
		NAME_MAX_LENGTH,
		SYNONYMS_MAX_COUNT
	} from '#lib/glossary/glossary.ts';
	import type { GlossaryDraft, GlossaryEntry, WikipediaArticle } from '#lib/glossary/types.ts';
	import { searchArticles, sourceOf } from '#lib/glossary/wikipedia.ts';
	import { fetchForms, suggestsForms } from '#lib/glossary/wiktionary.ts';
	import ArticleDialog from './ArticleDialog.svelte';
	import InflectionField, { type FormsOffer, type FormsStatus } from './InflectionField.svelte';

	type SearchStatus = 'idle' | 'searching' | 'found' | 'none' | 'failed';

	type Props = {
		entry?: GlossaryEntry;
		entries: GlossaryEntry[];
		index: CardIndexData;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let { entry, entries, index, cancelHref, oncancel, onsaved }: Props = $props();

	const SEARCH_DELAY_MS = 600;
	const tiles = glossaryCategoryTiles();
	const existing = untrack(() => entry);
	const initial = (): GlossaryDraft => (existing ? draftOf(existing) : emptyDraft());

	let form = $state<GlossaryDraft>(initial());
	let synonymsQuery = $state('');
	let formsQuery = $state('');
	let formsExpanded = $state(untrack(() => (existing?.forms.length ?? 0) === 0));
	let formsStatus = $state<FormsStatus>('idle');
	let formsAutoFilled = $state<string[] | null>(null);
	let formsName = $state<string | null>(untrack(() => existing?.name.trim() ?? null));
	let nameForms = $state<string[]>([]);
	let synonymForms = $state<Record<string, string[]>>({});
	let synonymMessage = $state<string>();
	let autoFilled = $state<string | null>(null);
	let status = $state<SearchStatus>('idle');
	let articles = $state<WikipediaArticle[]>([]);
	let articlesKey = $state('');
	let articlesOpen = $state(false);
	let replaceOpen = $state(false);
	let pendingArticle = $state<WikipediaArticle>();
	let nameError = $state<string>();
	let categoryError = $state<string>();
	let request = 0;
	let formsRequest = 0;
	let knownSynonyms = untrack(() => [...form.synonyms]);

	const formState = new FormState<GlossaryDraft>(initial());

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		draftChanged
	);

	let author = $derived(form.category === 'person' ? authorNamed(index, form.name) : undefined);
	let synonymOptions = $derived(newOption(synonymsQuery, form.synonyms));
	let formOptions = $derived(newOption(formsQuery, form.forms));
	let formsEligible = $derived(suggestsForms(form.name, form.category));
	let formsShownStatus = $derived<FormsStatus>(
		form.name.trim() && form.category && !formsEligible ? 'skipped' : formsStatus
	);
	let formsOffer = $derived.by((): FormsOffer | undefined => {
		if (!formsEligible) return undefined;
		const renamed =
			formsName !== null &&
			formsName.toLocaleLowerCase('pl') !== form.name.trim().toLocaleLowerCase('pl');
		if (form.forms.length === 0)
			return (existing || !autoFetch.forms) && (formsStatus === 'idle' || renamed)
				? 'fetch'
				: undefined;
		if (!existing && autoFetch.forms && formsReplaceable()) return undefined;
		return renamed ? 'refetch' : undefined;
	});
	let definitionHint = $derived(
		status === 'none'
			? m.glossary.form.definitionNone
			: status === 'failed'
				? m.glossary.form.definitionFailed
				: undefined
	);
	let placeholder = $derived(
		status === 'searching'
			? m.glossary.form.definitionSearching
			: autoFetch.definition
				? m.glossary.form.definitionPending
				: m.glossary.form.definitionManual
	);
	let definitionSearchable = $derived(
		!autoFetch.definition &&
			status !== 'searching' &&
			status !== 'failed' &&
			!form.source &&
			form.name.trim() !== '' &&
			!!form.category
	);

	function newOption(query: string, values: readonly string[]): ValueOption[] {
		const typed = query.replace(/\s+/g, ' ').trim();
		const key = typed.toLocaleLowerCase('pl');
		if (!typed || key === form.name.trim().toLocaleLowerCase('pl')) return [];
		if (values.some((item) => item.toLocaleLowerCase('pl') === key)) return [];
		return [{ kind: 'new', name: typed }];
	}

	function formsReplaceable(): boolean {
		return (
			form.forms.length === 0 ||
			(formsAutoFilled !== null && JSON.stringify(form.forms) === JSON.stringify(formsAutoFilled))
		);
	}

	function synonymKey(word: string): string {
		return word.trim().toLocaleLowerCase('pl');
	}

	function eligibleSynonyms(): string[] {
		return form.synonyms.filter((word) => suggestsForms(word, form.category));
	}

	function setForms(forms: string[]): void {
		const wasReplaceable = formsReplaceable();
		form.forms = cappedForms(forms);
		if (wasReplaceable) formsAutoFilled = form.forms;
	}

	async function suggestForms(): Promise<void> {
		const name = form.name.trim();
		if (!suggestsForms(name, form.category)) return;
		const current = ++formsRequest;
		formsStatus = 'searching';
		synonymMessage = undefined;
		const words = eligibleSynonyms();
		try {
			const [found, ...synonyms] = await Promise.all(
				[name, ...words].map((word) => fetchForms(word))
			);
			if (current !== formsRequest) return;
			nameForms = found;
			synonymForms = Object.fromEntries(words.map((word, i) => [synonymKey(word), synonyms[i]]));
			form.forms = cappedForms([...found, ...synonyms.flat()]);
			formsAutoFilled = form.forms;
			formsName = name;
			formsStatus = form.forms.length > 0 ? 'found' : 'none';
			if (form.forms.length > 0) formsExpanded = false;
		} catch {
			if (current !== formsRequest) return;
			formsStatus = 'failed';
		}
	}

	async function addSynonymForms(word: string): Promise<void> {
		if (!suggestsForms(word, form.category)) return;
		const key = synonymKey(word);
		synonymMessage = m.glossary.form.synonymFormsSearching(word);
		try {
			const found = await fetchForms(word);
			if (!form.synonyms.some((synonym) => synonymKey(synonym) === key)) return;
			synonymForms = { ...synonymForms, [key]: found };
			setForms([...form.forms, ...found]);
			synonymMessage = found.length > 0 ? undefined : m.glossary.form.synonymFormsNone(word);
		} catch {
			synonymMessage = m.glossary.form.formsFailed;
		}
	}

	function dropSynonymForms(word: string): void {
		const key = synonymKey(word);
		const dropped = synonymForms[key];
		if (!dropped) return;
		const rest = Object.fromEntries(
			Object.entries(synonymForms).filter(([synonym]) => synonym !== key)
		);
		synonymForms = rest;
		const kept = new Set([...nameForms, ...Object.values(rest).flat()]);
		setForms(form.forms.filter((item) => kept.has(item) || !dropped.includes(item)));
		synonymMessage = undefined;
	}

	$effect(() => {
		const current = [...form.synonyms];
		untrack(() => {
			const known = new Set(knownSynonyms.map(synonymKey));
			const now = new Set(current.map(synonymKey));
			const removed = knownSynonyms.filter((word) => !now.has(synonymKey(word)));
			const added = current.filter((word) => !known.has(synonymKey(word)));
			knownSynonyms = current;
			removed.forEach(dropSynonymForms);
			if (autoFetch.forms) added.forEach((word) => void addSynonymForms(word));
		});
	});

	$effect(() => {
		if (existing) return;
		const name = form.name.trim();
		const category = form.category;
		if (!name || !category) return;
		if (!suggestsForms(name, category)) {
			untrack(() => {
				formsRequest += 1;
				formsStatus = 'idle';
				if (formsAutoFilled !== null && formsReplaceable()) {
					form.forms = [];
					formsAutoFilled = null;
				}
			});
			return;
		}
		if (!autoFetch.forms) return;
		const timer = setTimeout(() => {
			if (untrack(formsReplaceable)) void suggestForms();
		}, SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	});

	function replaceable(): boolean {
		return form.definition === '' || form.definition === autoFilled;
	}

	function keyOf(name: string, category: string): string {
		return `${name.trim()}|${category}`;
	}

	function applyArticle(article: WikipediaArticle): void {
		form.definition = article.extract;
		form.source = sourceOf(article);
		autoFilled = article.extract;
	}

	async function search(fill: boolean): Promise<void> {
		const name = form.name.trim();
		const category = form.category;
		if (!name || !category) return;
		const current = ++request;
		status = 'searching';
		try {
			const found = await searchArticles(name, category);
			if (current !== request) return;
			articles = found;
			articlesKey = keyOf(name, category);
			status = found.length > 0 ? 'found' : 'none';
			if (!fill) return;
			if (found.length > 0) {
				if (replaceable()) applyArticle(found[0]);
			} else if (form.definition !== '' && form.definition === autoFilled) {
				form.definition = '';
				form.source = null;
				autoFilled = null;
			}
		} catch {
			if (current !== request) return;
			articles = [];
			articlesKey = '';
			status = 'failed';
		}
	}

	$effect(() => {
		const name = form.name.trim();
		const category = form.category;
		if (!name || !category || !autoFetch.definition) return;
		const timer = setTimeout(() => {
			if (untrack(replaceable)) void search(true);
		}, SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	});

	async function openArticles(): Promise<void> {
		articlesOpen = true;
		if (form.category && articlesKey === keyOf(form.name, form.category) && articles.length > 0) {
			status = 'found';
			return;
		}
		await search(false);
	}

	function useArticle(article: WikipediaArticle): void {
		articlesOpen = false;
		if (replaceable() || form.definition === article.extract) {
			applyArticle(article);
			return;
		}
		pendingArticle = article;
		replaceOpen = true;
	}

	function confirmReplace(): void {
		if (pendingArticle) applyArticle(pendingArticle);
		pendingArticle = undefined;
		replaceOpen = false;
	}

	function removeSource(): void {
		form.source = null;
		autoFilled = null;
	}

	function chooseCategory(value: string | null): void {
		form.category = isGlossaryCategory(value) ? value : null;
		categoryError = undefined;
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function validate(name: string): boolean {
		nameError = !name
			? m.valueForm.nameRequired
			: findNameConflict(entries, name, existing?.id)
				? m.glossary.form.nameTaken(name)
				: undefined;
		categoryError = form.category ? undefined : m.glossary.form.categoryRequired;
		return !nameError && !categoryError;
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			const name = form.name.trim();
			if (!validate(name)) return;
			const snapshot = $state.snapshot(form);
			const result = await saveGlossaryEntry(
				{
					...snapshot,
					name,
					synonyms: cleanForms(snapshot.synonyms),
					forms: cleanForms(snapshot.forms)
				},
				existing?.id
			);
			if (result.nameTaken) {
				nameError = m.glossary.form.nameTaken(name);
				return;
			}
			if (result.error || !result.id) {
				formState.error = result.error ?? m.common.unexpectedError;
				return;
			}
			formState.saved = snapshot;
			await onsaved(
				resolve('/(app)/atelier/glossary/[id]', { id: result.id }),
				m.glossary.view.saved(name)
			);
		});
	}
</script>

<div class="page">
	<Form error={formState.error} errorTitle={m.glossary.form.errorTitle} onsubmit={submit}>
		<div class="fields">
			<div class="name">
				<TextField
					autocomplete="off"
					error={nameError}
					label={m.glossary.form.name}
					maxlength={NAME_MAX_LENGTH}
					placeholder={m.glossary.form.namePlaceholder}
					bind:value={form.name}
				/>
				{#if author}
					<Alert tone="warning">
						<a href={valuePath('author', author.id)}>{author.name}</a>{m.glossary.form
							.authorWarningSuffix}
					</Alert>
				{/if}
				<div class="sort">
					<Checkbox label={m.glossary.form.sortByOther} bind:checked={form.sortByOther} />
					{#if form.sortByOther}
						<TextField
							autocomplete="off"
							hint={m.glossary.form.sortNameHint}
							label={m.glossary.form.sortName}
							maxlength={NAME_MAX_LENGTH}
							placeholder={m.glossary.form.sortNamePlaceholder}
							bind:value={form.sortName}
						/>
					{/if}
				</div>
			</div>

			<div class="category">
				<ChoiceTiles
					columns={3}
					label={m.glossary.form.category}
					narrowColumns={2}
					onchange={chooseCategory}
					options={tiles}
					value={form.category}
				/>
				{#if categoryError}
					<span class="error">{categoryError}</span>
				{/if}
			</div>

			<div class="definition">
				<TextArea
					hint={definitionHint}
					label={m.glossary.form.definition}
					maxlength={DEFINITION_MAX_LENGTH}
					{placeholder}
					rows={7}
					bind:value={form.definition}
				/>
				{#if status === 'failed'}
					<div class="links">
						<TextButton inline onclick={() => search(true)}>
							{m.glossary.form.searchAgain}
						</TextButton>
					</div>
				{/if}
				{#if definitionSearchable}
					<div class="links">
						<TextButton inline onclick={() => search(true)}>
							{m.glossary.form.searchDefinition}
						</TextButton>
					</div>
				{/if}
				{#if form.source}
					<div class="links">
						<span class="caption">
							{m.glossary.form.sourcePrefix}„{form.source.title}”, {form.source.licence}
						</span>
						<TextButton inline onclick={openArticles}>
							{m.glossary.form.pickArticle}
						</TextButton>
						<TextButton inline onclick={removeSource}>
							{m.glossary.form.removeSource}
						</TextButton>
					</div>
				{/if}
			</div>

			<ValueField
				hint={form.synonyms.length >= SYNONYMS_MAX_COUNT
					? m.glossary.form.synonymsFull
					: m.glossary.form.synonymsHint}
				label={m.glossary.form.synonyms}
				max={SYNONYMS_MAX_COUNT}
				options={synonymOptions}
				bind:query={synonymsQuery}
				bind:values={form.synonyms}
			/>

			<InflectionField
				message={formsStatus === 'searching' ? undefined : synonymMessage}
				offer={formsOffer}
				onfetch={suggestForms}
				options={formOptions}
				status={formsShownStatus}
				bind:expanded={formsExpanded}
				bind:forms={form.forms}
				bind:query={formsQuery}
			/>
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.glossary.form.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.glossary.form.saving : m.glossary.form.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.glossary.form.discardDescription} />

{#if form.category}
	<ArticleDialog
		{articles}
		currentTitle={form.source?.title}
		description={m.glossary.articles.description(
			form.name.trim(),
			glossaryCategoryName(form.category).toLocaleLowerCase('pl')
		)}
		failedText={m.glossary.form.definitionFailed}
		noneText={m.glossary.form.definitionNone}
		onuse={useArticle}
		status={status === 'idle' ? 'searching' : status === 'found' ? 'found' : status}
		bind:open={articlesOpen}
	/>
{/if}

<Dialog
	description={m.glossary.replaceConfirm.description}
	size="small"
	title={m.glossary.replaceConfirm.title}
	bind:open={replaceOpen}
>
	{#snippet footer()}
		<Button onclick={() => (replaceOpen = false)}>
			{m.glossary.replaceConfirm.keep}
		</Button>
		<Button onclick={confirmReplace} variant="primary">
			{m.glossary.replaceConfirm.replace}
		</Button>
	{/snippet}
</Dialog>

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
		margin-bottom: calc(-1 * var(--spacing-12));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	.name,
	.sort,
	.category,
	.definition {
		display: grid;
		gap: var(--spacing-2);
	}

	.name a {
		color: inherit;
		text-underline-offset: 0.2em;
	}

	.error,
	.caption {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.error {
		color: var(--color-danger);
	}

	.caption {
		color: var(--color-fg-muted);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-4);
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}
	}
</style>
