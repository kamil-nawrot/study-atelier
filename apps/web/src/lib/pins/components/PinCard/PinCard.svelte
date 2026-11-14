<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard/GlossaryTermCard.svelte';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import { resolve } from '$app/paths';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import PinView from '#lib/pins/components/PinView/PinView.svelte';

	type Props = {
		pin: Pin;
		entry?: GlossaryTerm;
		symbol?: { id: string; name: string; meanings?: { id: string; text: string }[] };
		image?: ArtworkImageInput | null;
		shownWidth?: number;
	};

	let { pin, entry, symbol, image, shownWidth }: Props = $props();

	const meaning = $derived(symbol?.meanings?.find((own) => own.id === pin.symbolMeaningId));
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
		<div class="entry">
			<span class="kind overline">
				<Icon icon={KeyRound} size="sm" />
				{m.symbols.view.overline}
			</span>
			<span class="name">{symbol.name}</span>
			{#if meaning}
				<span class="meaning">{meaning.text}</span>
			{/if}
			<div class="links">
				<a class="open" href={resolve('/(app)/atelier/glossary/symbols/[id]', { id: symbol.id })}>
					{m.symbols.card.open}
					<Icon icon={ArrowRight} size="sm" />
				</a>
			</div>
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

	.kind {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.meaning {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-6);
		padding-top: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-line);
	}

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	.open:hover {
		text-decoration: underline;
	}

	.text {
		margin: 0;
		white-space: pre-line;
	}
</style>
