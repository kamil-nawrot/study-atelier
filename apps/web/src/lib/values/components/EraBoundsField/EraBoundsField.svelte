<script lang="ts">
	import { Button, Dialog, TextButton } from '@study-atelier/ui';
	import {
		DEFAULT_ERA_JUNCTIONS,
		eraJunctions
	} from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
	import { yearOutsideEra } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';
	import {
		eraBoundsForm,
		eraHasEnd,
		eraHasStart,
		junctionsOf,
		neighbourNotes
	} from '#lib/values/era-bounds-form/era-bounds-form.ts';
	import type { EraBoundsErrors } from '#lib/values/types/era-bounds-errors.ts';
	import type { EraBoundsFormState } from '#lib/values/types/era-bounds-form-state.ts';
	import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';

	type Props = {
		code: EraCode;
		bounds: EraBoundsFormState;
		errors: EraBoundsErrors;
	};

	let { code, bounds = $bindable(), errors }: Props = $props();

	let confirmOpen = $state(false);
	let outside = $state(0);
	let answer: ((confirmed: boolean) => void) | undefined;

	let junctions = $derived(junctionsOf(code, bounds, eraJunctions()));
	let notes = $derived(neighbourNotes(code, eraJunctions(), junctions));
	let defaults = $derived(eraBoundsForm(code, DEFAULT_ERA_JUNCTIONS));
	let atDefaults = $derived(JSON.stringify(bounds) === JSON.stringify(defaults));

	export function changedJunctions(): number[] | undefined {
		return junctions && notes.length > 0 ? junctions : undefined;
	}

	export async function confirmChange(): Promise<boolean> {
		const next = changedJunctions();
		if (!next) return true;
		const { artworks } = await loadAtelier();
		outside = artworks.filter((artwork) => yearOutsideEra(artwork, next)).length;
		if (outside === 0) return true;
		confirmOpen = true;
		return new Promise((resolve) => (answer = resolve));
	}

	function close(confirmed: boolean): void {
		confirmOpen = false;
		answer?.(confirmed);
		answer = undefined;
	}
</script>

<div class="bounds">
	<YearGroup columns title={m.eraBounds.title}>
		{#snippet aside()}
			{#if !atDefaults}
				<TextButton inline onclick={() => (bounds = { ...defaults })}>
					{m.eraBounds.restore}
				</TextButton>
			{/if}
		{/snippet}
		{#if eraHasStart(code)}
			<YearInput
				beforeCommonEraLabel={m.eraBounds.startBeforeCommonEra}
				error={errors.start}
				label={m.eraBounds.start}
				placeholder={m.eraBounds.start}
				bind:value={bounds.startYear}
				bind:beforeCommonEra={bounds.startBeforeCommonEra}
			/>
		{/if}
		{#if eraHasEnd(code)}
			<YearInput
				beforeCommonEraLabel={m.eraBounds.endBeforeCommonEra}
				error={errors.end}
				label={m.eraBounds.end}
				placeholder={m.eraBounds.end}
				bind:value={bounds.endYear}
				bind:beforeCommonEra={bounds.endBeforeCommonEra}
			/>
		{/if}
	</YearGroup>
	<p class="hint">{m.eraBounds.hint}</p>
	{#each notes as note (note)}
		<p class="note">{note}</p>
	{/each}
</div>

<Dialog
	description={m.eraBounds.confirm.description(outside)}
	onclose={() => close(false)}
	size="small"
	title={m.eraBounds.confirm.title}
	bind:open={confirmOpen}
>
	{#snippet footer()}
		<Button onclick={() => close(false)}>
			{m.common.back}
		</Button>
		<Button onclick={() => close(true)} variant="primary">
			{m.eraBounds.confirm.save}
		</Button>
	{/snippet}
</Dialog>

<style>
	.bounds {
		display: grid;
		gap: var(--spacing-2);
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.note {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
