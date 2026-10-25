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
		TextField
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import { resolve } from '$app/paths';
	import {
		glossaryCategoryName,
		glossaryCategoryTiles,
		isGlossaryCategory
	} from '#lib/glossary/categories/categories.ts';
	import { DefinitionSearch } from '#lib/glossary/definition-search/definition-search.svelte.ts';
	import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
	import {
		authorNamed,
		cleanForms,
		draftChanged,
		draftOf,
		emptyDraft,
		findNameConflict,
		NAME_MAX_LENGTH
	} from '#lib/glossary/glossary/glossary.ts';
	import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import ArticleDialog from '#lib/glossary/components/ArticleDialog/ArticleDialog.svelte';
	import GlossaryDefinition from '#lib/glossary/components/GlossaryDefinition/GlossaryDefinition.svelte';
	import GlossaryWordForms from '#lib/glossary/components/GlossaryWordForms/GlossaryWordForms.svelte';

	type Props = {
		entry?: GlossaryEntry;
		entries: GlossaryEntry[];
		index: CardIndexData;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let { entry, entries, index, cancelHref, oncancel, onsaved }: Props = $props();

	const tiles = glossaryCategoryTiles();
	const existing = untrack(() => entry);
	const initial = (): GlossaryDraft => (existing ? draftOf(existing) : emptyDraft());

	let form = $state<GlossaryDraft>(initial());
	let nameError = $state<string>();
	let categoryError = $state<string>();

	const formState = new FormState<GlossaryDraft>(initial());
	const definition = new DefinitionSearch(() => form);
	definition.follow();

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		draftChanged
	);

	let author = $derived(form.category === 'person' ? authorNamed(index, form.name) : undefined);

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
					label={m.common.name}
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

			<GlossaryDefinition search={definition} />

			<GlossaryWordForms {existing} bind:form />
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.common.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.common.saving : m.common.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

{#if form.category}
	<ArticleDialog
		articles={definition.articles}
		currentTitle={form.source?.title}
		description={m.glossary.articles.description(
			form.name.trim(),
			glossaryCategoryName(form.category).toLocaleLowerCase('pl')
		)}
		failedText={m.glossary.form.definitionFailed}
		noneText={m.glossary.form.definitionNone}
		onuse={(article) => definition.use(article)}
		status={definition.status === 'idle' ? 'searching' : definition.status}
		bind:open={definition.articlesOpen}
	/>
{/if}

<Dialog
	description={m.glossary.replaceConfirm.description}
	size="small"
	title={m.glossary.replaceConfirm.title}
	bind:open={definition.replaceOpen}
>
	{#snippet footer()}
		<Button onclick={() => (definition.replaceOpen = false)}>
			{m.glossary.replaceConfirm.keep}
		</Button>
		<Button onclick={() => definition.confirmReplace()} variant="primary">
			{m.common.replace}
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
	.category {
		display: grid;
		gap: var(--spacing-2);
	}

	.name a {
		color: inherit;
		text-underline-offset: 0.2em;
	}

	.error {
		color: var(--color-danger);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}
	}
</style>
