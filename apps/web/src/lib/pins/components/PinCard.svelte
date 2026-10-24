<script lang="ts">
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import type { Pin } from '#lib/pins/types.ts';
	import PinView from './PinView.svelte';

	type Props = {
		pin: Pin;
		entry?: GlossaryEntry;
		image?: ArtworkImageInput | null;
		shownWidth?: number;
	};

	let { pin, entry, image, shownWidth }: Props = $props();
</script>

<div class="card">
	{#if image && pin.viewWidth !== undefined}
		<PinView {image} {shownWidth} viewWidth={pin.viewWidth} x={pin.x} y={pin.y} />
	{/if}
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
