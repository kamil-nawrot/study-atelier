<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { Alert, Disclosure, Icon, Toast } from '@study-atelier/ui';
	import { invalidateAll } from '$app/navigation';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadSymbolForm } from '#lib/symbols/symbol-page-data/symbol-page-data.ts';
	import {
		withMeaning,
		withMovedMeaning,
		withoutMeaning
	} from '#lib/symbols/meaning-edits/meaning-edits.ts';
	import {
		assignMeaning,
		saveSymbol,
		setSymbolCover
	} from '#lib/symbols/symbols-data/symbols-data.ts';
	import MeaningDeleteDialog from '#lib/symbols/components/MeaningDeleteDialog/MeaningDeleteDialog.svelte';
	import MeaningDetailsDialog from '#lib/symbols/components/MeaningDetailsDialog/MeaningDetailsDialog.svelte';
	import MeaningDialog from '#lib/symbols/components/MeaningDialog/MeaningDialog.svelte';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
	import type { SymbolDraft } from '#lib/symbols/types/symbol-draft.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';
	import SymbolDetails from '#lib/symbols/components/SymbolDetails/SymbolDetails.svelte';
	import SymbolMeaningSection from '#lib/symbols/components/SymbolMeaningSection/SymbolMeaningSection.svelte';
	import SymbolTimeline from '#lib/symbols/components/SymbolTimeline/SymbolTimeline.svelte';
	import type { SymbolPageResult } from '#lib/symbols/types/symbol-page-result.ts';
	import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

	type Props = {
		symbol: SymbolEntry;
		page: SymbolPageResult;
		reordering?: boolean;
	};

	let { symbol, page, reordering = false }: Props = $props();

	let toast: Toast;
	let chosen = $state<{ pinId: string | null }>();
	let pageError = $state<string>();
	const coverPinId = $derived(chosen ? (chosen.pinId ?? undefined) : symbol.coverPinId);

	let dialogOpen = $state(false);
	let removeOpen = $state(false);
	let assignOpen = $state(false);
	let editing = $state<SymbolMeaning>();
	let candidates = $state<readonly SymbolContext[]>([]);
	let dialogError = $state<string>();
	let busy = $state(false);

	async function openDialog(meaning?: SymbolMeaning): Promise<void> {
		editing = meaning;
		dialogError = undefined;
		dialogOpen = true;
		if (candidates.length === 0) candidates = (await loadSymbolForm()).candidates;
	}

	export function addMeaning(): Promise<void> {
		return openDialog();
	}

	async function store(draft: SymbolDraft, message?: string): Promise<boolean> {
		busy = true;
		const result = await saveSymbol(draft, symbol.id);
		busy = false;
		if (result.nameTaken || result.error || !result.id) {
			dialogError = result.error ?? m.common.unexpectedError;
			return false;
		}
		await invalidateAll();
		if (message) toast.show(message);
		return true;
	}

	async function saveMeaning(meaning: { text: string; contexts: SymbolContext[] }): Promise<void> {
		if (await store(withMeaning(symbol, meaning, editing?.id), m.symbols.meaningDialog.saved)) {
			dialogOpen = false;
		}
	}

	async function removeMeaning(): Promise<void> {
		if (!editing) return;
		if (await store(withoutMeaning(symbol, editing.id), m.symbols.meaningDialog.removed)) {
			removeOpen = false;
			dialogOpen = false;
		}
	}

	async function moveMeaning(id: string, step: -1 | 1): Promise<void> {
		pageError = undefined;
		if (!(await store(withMovedMeaning(symbol, id, step)))) pageError = dialogError;
	}

	function askRemove(meaning: SymbolMeaning): void {
		editing = meaning;
		dialogError = undefined;
		removeOpen = true;
	}

	function openAssign(meaning: SymbolMeaning): void {
		editing = meaning;
		dialogError = undefined;
		assignOpen = true;
	}

	async function saveAssigned(pinIds: string[]): Promise<void> {
		if (!editing) return;
		busy = true;
		const { error } = await assignMeaning(editing.id, pinIds);
		busy = false;
		if (error) {
			dialogError = error;
			return;
		}
		await invalidateAll();
		assignOpen = false;
		toast.show(m.symbols.meaningDialog.assigned);
	}

	async function setCover(pinId: string | null): Promise<void> {
		pageError = undefined;
		const { error } = await setSymbolCover(symbol.id, pinId);
		if (error) pageError = error;
		else {
			chosen = { pinId };
			toast.show(m.symbols.view.mainDetailSaved);
		}
	}
</script>

<div class="view">
	<article>
		<header>
			<p class="kind overline">
				<Icon icon={KeyRound} size="sm" />
				{m.symbols.view.overline}
			</p>
			<h1>{symbol.name}</h1>
		</header>

		{#if symbol.description}
			<blockquote>
				<p class="description">{symbol.description}</p>
			</blockquote>
		{/if}
	</article>

	{#if page.detailsError}
		<Alert tone="danger">{page.detailsError}</Alert>
	{/if}

	{#if pageError}
		<Alert tone="danger">{pageError}</Alert>
	{/if}

	{#each page.sections as section, index (section.meaning.id)}
		<SymbolMeaningSection
			{coverPinId}
			first={index === 0}
			last={index === page.sections.length - 1}
			moving={busy}
			number={index + 1}
			onassign={() => openAssign(section.meaning)}
			onedit={() => openDialog(section.meaning)}
			onmove={(step) => moveMeaning(section.meaning.id, step)}
			onremove={() => askRemove(section.meaning)}
			onsetcover={setCover}
			pinsShown={!page.detailsError}
			{reordering}
			{section}
		/>
	{/each}

	{#if page.sections.length === 0 && !page.detailsError}
		<p class="empty">{m.symbols.meaningDialog.noMeanings}</p>
	{/if}

	{#if page.withoutMeaning.length > 0}
		<section aria-labelledby="without-meaning">
			<Disclosure
				id="without-meaning"
				count={page.withoutMeaning.length}
				room
				title={m.symbols.view.withoutMeaning}
			>
				<SymbolDetails {coverPinId} details={page.withoutMeaning} onsetcover={setCover} />
			</Disclosure>
		</section>
	{/if}

	<SymbolTimeline details={page.details} />
</div>

<MeaningDialog
	{busy}
	{candidates}
	error={removeOpen ? undefined : dialogError}
	meaning={editing}
	onremove={editing ? () => askRemove(editing as SymbolMeaning) : undefined}
	onsave={saveMeaning}
	bind:open={dialogOpen}
/>

<MeaningDeleteDialog
	{busy}
	error={removeOpen ? dialogError : undefined}
	meaning={editing}
	onconfirm={removeMeaning}
	bind:open={removeOpen}
/>

<MeaningDetailsDialog
	{busy}
	details={page.details}
	error={assignOpen ? dialogError : undefined}
	meaning={editing}
	meanings={symbol.meanings}
	onsave={saveAssigned}
	bind:open={assignOpen}
/>

<Toast bind:this={toast} />

<style>
	article,
	header {
		display: grid;
		gap: var(--spacing-2);
	}

	article {
		gap: var(--spacing-8);
		max-width: var(--size-content-default);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	blockquote {
		margin: 0;
		padding-left: var(--spacing-4);
		border-left: var(--border-width-button) solid var(--color-fg-muted);
	}

	.description {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
		white-space: pre-line;
	}

	.view {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8);
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
