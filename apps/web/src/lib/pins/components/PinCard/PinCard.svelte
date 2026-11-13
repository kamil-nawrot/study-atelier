<script lang="ts">
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard/GlossaryTermCard.svelte';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import { resolve } from '$app/paths';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import PinView from '#lib/pins/components/PinView/PinView.svelte';

	type Props = {
		pin: Pin;
		entry?: GlossaryTerm;
		symbol?: { id: string; name: string };
		image?: ArtworkImageInput | null;
		shownWidth?: number;
	};

	let { pin, entry, symbol, image, shownWidth }: Props = $props();
</script>

<div class="card">
	{#if image && pin.viewWidth !== undefined}
		<PinView {image} {shownWidth} viewWidth={pin.viewWidth} x={pin.x} y={pin.y} />
	{/if}
	{#if entry}
		<div class="entry">
			<GlossaryTermCard linked term={entry} />
		</div>
	{/if}
	{#if symbol}
		<a class="symbol" href={resolve('/(app)/atelier/glossary/symbols/[id]', { id: symbol.id })}
			>{symbol.name}</a
		>
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

	.symbol {
		justify-self: start;
		color: var(--color-fg);
		font-style: italic;
	}

	.text {
		margin: 0;
		white-space: pre-line;
	}
</style>
