<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import ContextTags from '#lib/symbols/components/ContextTags/ContextTags.svelte';
	import SymbolDetails from '#lib/symbols/components/SymbolDetails/SymbolDetails.svelte';
	import type { MeaningSection } from '#lib/symbols/types/meaning-section.ts';

	type Props = {
		section: MeaningSection;
		number: number;
		pinsShown: boolean;
		coverPinId?: string;
		onsetcover?: (pinId: string | null) => void;
	};

	let { section, number, pinsShown, coverPinId, onsetcover }: Props = $props();
</script>

<section class="meaning" aria-labelledby="meaning-{section.meaning.id}">
	<h2 id="meaning-{section.meaning.id}">
		<span class="number">{number}</span>
		<span class="text">{section.meaning.text}</span>
	</h2>
	<div class="body">
		<div class="about">
			<ContextTags contexts={section.meaning.contexts} />
		</div>
		{#if section.details.length > 0}
			<SymbolDetails {coverPinId} details={section.details} {onsetcover} />
		{:else if pinsShown}
			<p class="empty">{m.symbols.view.noDetails}</p>
		{/if}
	</div>
</section>

<style>
	.meaning {
		--meaning-number: var(--spacing-8);

		display: grid;
		gap: var(--spacing-4);
		padding: var(--spacing-8) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		display: grid;
		grid-template-columns: var(--meaning-number) minmax(0, 1fr);
		align-items: baseline;
		gap: var(--spacing-3);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.number {
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}

	.text {
		font-style: italic;
	}

	.body {
		display: grid;
		gap: var(--spacing-4);
		min-width: 0;
		padding-inline-start: calc(var(--meaning-number) + var(--spacing-3));
	}

	.about {
		display: grid;
		gap: var(--spacing-2);
	}

	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	@media (max-width: 767.98px) {
		.meaning {
			--meaning-number: var(--spacing-6);
		}

		h2 {
			font-size: var(--font-size-xl);
			line-height: var(--line-height-xl);
		}
	}
</style>
