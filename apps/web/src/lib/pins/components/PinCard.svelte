<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { Pin } from '../types.ts';

	type Props = {
		open?: boolean;
		pin?: Pin;
		number: number;
		entry?: GlossaryEntry;
	};

	let { open = $bindable(false), pin, number, entry }: Props = $props();
</script>

<Dialog size="small" title={m.pins.cardTitle(number)} bind:open>
	<div class="card">
		{#if entry}
			<div class="entry">
				<GlossaryTermCard {entry} linked />
			</div>
		{/if}
		{#if pin?.text}
			<p class="text">{pin.text}</p>
		{/if}
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.pins.cardClose}
		</Button>
	{/snippet}
</Dialog>

<style>
	.card {
		display: grid;
		gap: var(--spacing-4);
	}

	.entry {
		display: grid;
		justify-items: start;
		gap: var(--spacing-2);
	}

	.text {
		margin: 0;
		white-space: pre-line;
	}
</style>
