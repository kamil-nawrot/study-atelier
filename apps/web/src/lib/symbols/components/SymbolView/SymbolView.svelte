<script lang="ts">
	import { Alert, Toast } from '@study-atelier/ui';
	import { invalidateAll } from '$app/navigation';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadSymbolForm } from '#lib/symbols/symbol-page-data/symbol-page-data.ts';
	import {
		withMeaning,
		withMovedMeaning,
		withoutMeaning
	} from '#lib/symbols/meaning-edits/meaning-edits.ts';
	import {
		saveSymbol,
		setPinMeaning,
		setSymbolCover
	} from '#lib/symbols/symbols-data/symbols-data.ts';
	import MeaningDeleteDialog from '#lib/symbols/components/MeaningDeleteDialog/MeaningDeleteDialog.svelte';
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
	};

	let { symbol, page }: Props = $props();

	let toast: Toast;
	let chosen = $state<{ pinId: string | null }>();
	let coverError = $state<string>();
	const coverPinId = $derived(chosen ? (chosen.pinId ?? undefined) : symbol.coverPinId);

	let dialogOpen = $state(false);
	let removeOpen = $state(false);
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
		await store(withMovedMeaning(symbol, id, step));
		if (dialogError) coverError = dialogError;
	}

	function askRemove(meaning: SymbolMeaning): void {
		editing = meaning;
		dialogError = undefined;
		removeOpen = true;
	}

	async function setMeaning(pinId: string, meaningId: string | null): Promise<void> {
		coverError = undefined;
		const { error } = await setPinMeaning(pinId, meaningId);
		if (error) coverError = error;
		else {
			await invalidateAll();
			toast.show(m.symbols.view.meaningChanged);
		}
	}

	async function setCover(pinId: string | null): Promise<void> {
		coverError = undefined;
		const { error } = await setSymbolCover(symbol.id, pinId);
		if (error) coverError = error;
		else {
			chosen = { pinId };
			toast.show(m.symbols.view.mainDetailSaved);
		}
	}
</script>

<header class="head">
	<span class="overline">{m.symbols.view.overline}</span>
	<h1>{symbol.name}</h1>
	{#if symbol.description}
		<p class="description">{symbol.description}</p>
	{/if}
</header>

{#if page.detailsError}
	<Alert tone="danger">{page.detailsError}</Alert>
{/if}

{#if coverError}
	<Alert tone="danger">{coverError}</Alert>
{/if}

{#each page.sections as section, index (section.meaning.id)}
	<SymbolMeaningSection
		{coverPinId}
		first={index === 0}
		last={index === page.sections.length - 1}
		meanings={symbol.meanings}
		number={index + 1}
		onedit={() => openDialog(section.meaning)}
		onmove={(step) => moveMeaning(section.meaning.id, step)}
		onremove={() => askRemove(section.meaning)}
		onsetcover={setCover}
		onsetmeaning={setMeaning}
		pinsShown={!page.detailsError}
		{section}
	/>
{/each}

{#if page.sections.length === 0 && !page.detailsError}
	<p class="empty">{m.symbols.meaningDialog.noMeanings}</p>
{/if}

{#if page.withoutMeaning.length > 0}
	<section class="rest" aria-labelledby="without-meaning">
		<h2 id="without-meaning">{m.symbols.view.withoutMeaning}</h2>
		<SymbolDetails
			{coverPinId}
			details={page.withoutMeaning}
			meanings={symbol.meanings}
			onsetcover={setCover}
			onsetmeaning={setMeaning}
		/>
	</section>
{/if}

<SymbolTimeline details={page.details} />

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
	onconfirm={removeMeaning}
	bind:open={removeOpen}
/>

<Toast bind:this={toast} />

<style>
	.head {
		display: grid;
		gap: var(--spacing-1);
		padding-bottom: var(--spacing-8);
	}

	.overline {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.description {
		max-width: var(--size-content-default);
		color: var(--color-fg-muted);
		white-space: pre-line;
	}

	.rest {
		display: grid;
		gap: var(--spacing-4);
		padding: var(--spacing-8) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-sm);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	@media (max-width: 767.98px) {
		h1 {
			font-size: var(--font-size-2xl);
			line-height: var(--line-height-2xl);
		}
	}
</style>
