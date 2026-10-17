<script lang="ts">
	import { tick, untrack } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		ChoiceTiles,
		Dialog,
		Form,
		FormActions,
		TextArea,
		TextField,
		ValueField,
		type ValueOption
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/index.ts';
	import type { CardIndexData } from '#lib/collection/types.ts';
	import DiscardDialog from '#lib/collection/components/DiscardDialog.svelte';
	import { UnsavedChanges } from '#lib/collection/unsaved-changes.svelte.ts';
	import { valuePath } from '#lib/collection/value-pages.ts';
	import { resolve } from '$app/paths';
	import { glossaryCategoryTiles, isGlossaryCategory } from '../categories.ts';
	import { saveGlossaryEntry } from '../glossary-data.ts';
	import {
		authorNamed,
		cleanForms,
		DEFINITION_MAX_LENGTH,
		draftChanged,
		draftOf,
		emptyDraft,
		findNameConflict,
		NAME_MAX_LENGTH
	} from '../glossary.ts';
	import type { GlossaryDraft, GlossaryEntry, WikipediaArticle } from '../types.ts';
	import { searchArticles, sourceOf } from '../wikipedia.ts';
	import { fetchForms, suggestsForms } from '../wiktionary.ts';
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
	const formId = $props.id();
	const formErrorId = `${formId}-error`;
	const existing = untrack(() => entry);
	const initial = (): GlossaryDraft => (existing ? draftOf(existing) : emptyDraft());

	let form = $state<GlossaryDraft>(initial());
	let saved = $state<GlossaryDraft>(initial());
	let synonymsQuery = $state('');
	let formsQuery = $state('');
	let formsExpanded = $state(untrack(() => (existing?.forms.length ?? 0) === 0));
	let formsStatus = $state<FormsStatus>('idle');
	let formsAutoFilled = $state<string[] | null>(null);
	let formsName = $state<string | null>(untrack(() => existing?.name.trim() ?? null));
	let autoFilled = $state<string | null>(null);
	let status = $state<SearchStatus>('idle');
	let articles = $state<WikipediaArticle[]>([]);
	let articlesKey = $state('');
	let articlesOpen = $state(false);
	let replaceOpen = $state(false);
	let pendingArticle = $state<WikipediaArticle>();
	let nameError = $state<string>();
	let categoryError = $state<string>();
	let formError = $state('');
	let busy = $state(false);
	let request = 0;
	let formsRequest = 0;

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => saved,
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
			return existing && (formsStatus === 'idle' || renamed) ? 'fetch' : undefined;
		if (!existing && formsReplaceable()) return undefined;
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
		status === 'searching' ? m.glossary.form.definitionSearching : m.glossary.form.definitionPending
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

	async function suggestForms(): Promise<void> {
		const name = form.name.trim();
		if (!suggestsForms(name, form.category)) return;
		const current = ++formsRequest;
		formsStatus = 'searching';
		try {
			const found = await fetchForms(name);
			if (current !== formsRequest) return;
			form.forms = found;
			formsAutoFilled = found;
			formsName = name;
			formsStatus = found.length > 0 ? 'found' : 'none';
			if (found.length > 0) formsExpanded = false;
		} catch {
			if (current !== formsRequest) return;
			formsStatus = 'failed';
		}
	}

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
		if (!name || !category) return;
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

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	async function submit(): Promise<void> {
		if (busy) return;
		formError = '';
		const name = form.name.trim();
		nameError = !name
			? m.valueForm.nameRequired
			: findNameConflict(entries, name, existing?.id)
				? m.glossary.form.nameTaken(name)
				: undefined;
		categoryError = form.category ? undefined : m.glossary.form.categoryRequired;
		if (nameError || categoryError) return;
		busy = true;
		const snapshot = $state.snapshot(form);
		try {
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
				await showError(result.error ?? m.common.unexpectedError);
				return;
			}
			saved = snapshot;
			await onsaved(
				resolve('/(app)/atelier/glossary/[id]', { id: result.id }),
				m.glossary.view.saved(name)
			);
		} finally {
			busy = false;
		}
	}
</script>

<div class="page">
	<Form onsubmit={submit}>
		{#if formError}
			<Alert id={formErrorId} title={m.glossary.form.errorTitle} tone="danger">
				{formError}
			</Alert>
		{/if}

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
						<button class="link" onclick={() => search(true)} type="button">
							{m.glossary.form.searchAgain}
						</button>
					</div>
				{/if}
				{#if form.source}
					<div class="links">
						<span class="caption">
							{m.glossary.form.sourcePrefix}„{form.source.title}”, {form.source.licence}
						</span>
						<button class="link" onclick={openArticles} type="button">
							{m.glossary.form.pickArticle}
						</button>
						<button class="link" onclick={removeSource} type="button">
							{m.glossary.form.removeSource}
						</button>
					</div>
				{/if}
			</div>

			<ValueField
				hint={m.glossary.form.synonymsHint}
				label={m.glossary.form.synonyms}
				options={synonymOptions}
				bind:query={synonymsQuery}
				bind:values={form.synonyms}
			/>

			<InflectionField
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
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.glossary.form.saving : m.glossary.form.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.glossary.form.discardDescription} />

{#if form.category}
	<ArticleDialog
		name={form.name}
		{articles}
		category={form.category}
		currentTitle={form.source?.title}
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

	.link {
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}
	}
</style>
