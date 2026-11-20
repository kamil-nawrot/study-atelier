<script lang="ts">
	import { Alert, Button, ChoiceTiles, Dialog, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		glossaryCategoryName,
		glossaryCategoryTiles,
		isGlossaryCategory,
		kindOf
	} from '#lib/glossary/categories/categories.ts';
	import { DefinitionSearch } from '#lib/glossary/definition-search/definition-search.svelte.ts';
	import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
	import {
		emptyDraft,
		findNameConflict,
		NAME_MAX_LENGTH
	} from '#lib/glossary/glossary/glossary.ts';
	import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
	import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import ArticleDialog from '#lib/glossary/components/ArticleDialog/ArticleDialog.svelte';
	import GlossaryDefinition from '#lib/glossary/components/GlossaryDefinition/GlossaryDefinition.svelte';

	type Props = {
		open?: boolean;
		name: string;
		kind?: GlossaryKind;
		entries: readonly GlossaryTerm[];
		onadded: (term: GlossaryTerm) => void;
	};

	let { open = $bindable(false), name, kind = 'term', entries, onadded }: Props = $props();

	let figure = $derived(kind === 'figure');
	let tiles = $derived(glossaryCategoryTiles(kind));

	let form = $state<GlossaryDraft>(emptyDraft());
	let nameError = $state<string>();
	let categoryError = $state<string>();
	let failure = $state<string>();
	let busy = $state(false);

	const definition = new DefinitionSearch(() => form);
	definition.follow();

	$effect.pre(() => {
		if (!open) return;
		form = { ...emptyDraft(), name: name.trim() };
		nameError = undefined;
		categoryError = undefined;
		failure = undefined;
		busy = false;
	});

	function chooseCategory(value: string | null): void {
		form.category = isGlossaryCategory(value) ? value : null;
		categoryError = undefined;
	}

	function check(trimmed: string): boolean {
		const conflict = trimmed ? findNameConflict(entries, trimmed) : undefined;
		nameError = !trimmed
			? m.valueForm.nameRequired
			: conflict
				? m.glossary.form.nameTaken(trimmed, kindOf(conflict.category) === 'figure')
				: undefined;
		categoryError = form.category ? undefined : m.glossary.form.categoryRequired;
		return !nameError && !categoryError;
	}

	async function add(): Promise<void> {
		const trimmed = form.name.trim();
		if (busy || definition.filling || !check(trimmed) || !form.category) return;
		busy = true;
		failure = undefined;
		const result = await saveGlossaryEntry({ ...$state.snapshot(form), name: trimmed });
		busy = false;
		if (result.nameTaken) {
			nameError = m.glossary.form.nameTaken(trimmed, figure);
			return;
		}
		if (result.error || !result.id) {
			failure = result.error ?? m.common.unexpectedError;
			return;
		}
		open = false;
		onadded({
			id: result.id,
			name: trimmed,
			category: form.category,
			synonyms: [],
			forms: [],
			hasDefinition: form.definition.trim() !== ''
		});
	}
</script>

<Dialog title={figure ? m.glossary.form.newFigureTitle : m.glossary.form.newTitle} bind:open>
	<div class="fields">
		{#if failure}
			<Alert
				title={figure ? m.glossary.quick.figureErrorTitle : m.glossary.quick.errorTitle}
				tone="danger">{failure}</Alert
			>
		{/if}
		<TextField
			autocomplete="off"
			error={nameError}
			label={m.common.name}
			maxlength={NAME_MAX_LENGTH}
			required
			bind:value={form.name}
		/>
		<div class="category">
			<ChoiceTiles
				columns={3}
				label={m.glossary.form.category}
				narrowColumns={2}
				onchange={chooseCategory}
				options={tiles}
				required
				value={form.category}
			/>
			{#if categoryError}
				<span class="error">{categoryError}</span>
			{/if}
		</div>
		<GlossaryDefinition search={definition} />
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>{m.common.cancel}</Button>
		<Button disabled={busy || definition.filling} onclick={add} variant="primary">
			{busy ? m.common.saving : figure ? m.glossary.quick.addFigure : m.glossary.quick.add}
		</Button>
	{/snippet}
</Dialog>
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
	.fields {
		display: grid;
		gap: var(--spacing-4);
	}

	.category {
		display: grid;
		gap: var(--spacing-2);
	}

	.error {
		color: var(--color-danger);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
