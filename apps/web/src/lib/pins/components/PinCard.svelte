<script lang="ts">
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import type { Pin } from '../types.ts';

	type Props = {
		pin: Pin;
		entry?: GlossaryEntry;
	};

	let { pin, entry }: Props = $props();
</script>

<div class="card">
	{#if entry}
		<div class="entry">
			<GlossaryTermCard {entry} linked />
		</div>
	{/if}
	{#if pin.text}
		<p class="text">{pin.text}</p>
	{/if}
</div>

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
