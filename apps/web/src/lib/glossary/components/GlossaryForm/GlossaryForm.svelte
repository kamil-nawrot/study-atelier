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
	import FixNote from '#lib/backroom/components/FixNote/FixNote.svelte';
	import { FormFlags } from '#lib/backroom/form-flags/form-flags.svelte.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { LiveErrors } from '#lib/shared/forms/live-errors/live-errors.svelte.ts';
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
	import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import { glossaryFormTexts } from '#lib/glossary/form-texts/form-texts.ts';
	import { FIGURE_COUNTRY_MAX_LENGTH } from '#lib/glossary/figure-form/figure-form.ts';
	import { validateLifeYears } from '#lib/values/author-form/author-form.ts';
	import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
	import AuthorLifeFields from '#lib/values/components/AuthorLifeFields/AuthorLifeFields.svelte';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import StagedFormColumns from '#lib/shared/forms/StagedFormColumns/StagedFormColumns.svelte';
	import ArticleDialog from '#lib/glossary/components/ArticleDialog/ArticleDialog.svelte';
	import GlossaryDefinition from '#lib/glossary/components/GlossaryDefinition/GlossaryDefinition.svelte';
	import GlossaryWordForms from '#lib/glossary/components/GlossaryWordForms/GlossaryWordForms.svelte';

	type Props = {
		entry?: GlossaryEntry;
		kind: GlossaryKind;
		entries: GlossaryTerm[];
		index: CardIndexData;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
		labels?: { save: string; cancel: string };
	};

	let { entry, kind, entries, index, cancelHref, oncancel, onsaved, labels }: Props = $props();
	const flags = new FormFlags('term', () => (entry ? { termId: entry.id } : undefined));

	const existing = untrack(() => entry);
	const entryKind = existing?.kind ?? untrack(() => kind);
	const figure = entryKind === 'figure';
	const tiles = glossaryCategoryTiles(entryKind);
	const initial = (): GlossaryDraft => (existing ? draftOf(existing) : emptyDraft(entryKind));

	let form = $state<GlossaryDraft>(initial());

	const formState = new FormState<GlossaryDraft>(initial());
	const definition = new DefinitionSearch(
		() => form,
		() => figure
	);
	const texts = glossaryFormTexts(figure);
	let barHeight = $state(0);
	let formsFilling = $state(false);
	definition.follow();

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		draftChanged
	);

	let author = $derived(figure ? authorNamed(index, form.name) : undefined);

	function chooseCategory(value: string | null): void {
		form.category = isGlossaryCategory(value) ? value : null;
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	const errors = new LiveErrors<{ name?: string; life?: AuthorFieldErrors }>(
		() => {
			const name = form.name.trim();
			const conflict = name ? findNameConflict(entries, name, existing?.id) : undefined;
			return {
				name: !name
					? m.valueForm.nameRequired
					: conflict
						? m.glossary.form.nameTaken(name, conflict.kind === 'figure')
						: undefined,
				life: figure ? validateLifeYears(form.figure) : undefined
			};
		}
	);

	function submit(): Promise<void> {
		return formState.run(async () => {
			const name = form.name.trim();
			if (!errors.check()) return;
			const snapshot = $state.snapshot(form);
			const result = await saveGlossaryEntry(
				{
					...snapshot,
					name,
					synonyms: cleanForms(snapshot.synonyms),
					forms: cleanForms(snapshot.forms)
				},
				existing?.id,
				existing
			);
			if (result.nameTaken) {
				errors.add({ name: m.glossary.form.nameTaken(name, figure) }, () => form.name.trim());
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

{#snippet nameFields()}
	<FixNote field="top" {flags} />
	<div class="name">
		<TextField
			autocomplete="off"
			error={errors.current.name}
			label={m.common.name}
			maxlength={NAME_MAX_LENGTH}
			required
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
					hint={texts.sortNameHint}
					label={m.glossary.form.sortName}
					maxlength={NAME_MAX_LENGTH}
					bind:value={form.sortName}
				/>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet detailFields()}
	<ChoiceTiles
		clearable
		columns={3}
		label={m.glossary.form.category}
		narrowColumns={2}
		onchange={chooseCategory}
		options={tiles}
		value={form.category}
	/>

	{#if figure}
		<AuthorLifeFields errors={errors.current.life ?? {}} bind:author={form.figure} />
		<TextField
			autocomplete="off"
			hint={m.valueForm.authorCountryHint}
			label={m.valueForm.authorCountry}
			maxlength={FIGURE_COUNTRY_MAX_LENGTH}
			bind:value={form.figure.country}
		/>
	{/if}

	<FixNote field="definition" {flags} />
	<GlossaryDefinition search={definition} />

	<FixNote field="forms" {flags} />
	<GlossaryWordForms
		{existing}
		{figure}
		onfilling={(filling) => (formsFilling = filling)}
		bind:form
	/>
{/snippet}

<div class="page">
	<Form
		error={formState.error}
		errorTitle={figure ? m.glossary.form.figureErrorTitle : m.glossary.form.errorTitle}
		onsubmit={submit}
	>
		{#if figure}
			<StagedFormColumns actionsHeight={barHeight}>
				{#snippet head()}
					{@render nameFields()}
				{/snippet}
				{#snippet images()}
					<ImageField
						alt={form.name.trim() || existing?.name || ''}
						compactEmpty
						query={{ kind: 'person', name: form.name }}
						searchReady={form.name.trim() !== ''}
						staged
						texts={m.valueForm.portrait}
						bind:image={form.figure.image}
					/>
				{/snippet}
				{#snippet fields()}
					{@render detailFields()}
				{/snippet}
			</StagedFormColumns>
		{:else}
			<div class="fields">
				{@render nameFields()}
				{@render detailFields()}
			</div>
		{/if}

		<FormActions bind:height={barHeight}>
			<Button href={cancelHref} onclick={oncancel}>
				{labels?.cancel ?? m.common.cancel}
			</Button>
			<Button
				disabled={formState.busy || definition.filling || formsFilling}
				type="submit"
				variant="primary"
			>
				{formState.busy ? m.common.saving : (labels?.save ?? m.common.save)}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

<ArticleDialog
	articles={definition.articles}
	currentTitle={form.source?.title}
	description={m.glossary.articles.description(
		form.name.trim(),
		form.category ? glossaryCategoryName(form.category).toLocaleLowerCase('pl') : null
	)}
	failedText={definition.texts.definitionFailed}
	noneText={definition.texts.definitionNone}
	onuse={(article) => definition.use(article)}
	status={definition.status === 'idle' ? 'searching' : definition.status}
	bind:open={definition.articlesOpen}
/>

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
	.sort {
		display: grid;
		gap: var(--spacing-2);
	}

	.name a {
		color: inherit;
		text-underline-offset: 0.2em;
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}
	}
</style>
