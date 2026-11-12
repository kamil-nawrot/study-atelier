<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import ContextTags from '#lib/symbols/components/ContextTags/ContextTags.svelte';
	import SymbolDetails from '#lib/symbols/components/SymbolDetails/SymbolDetails.svelte';
	import type { MeaningSection } from '#lib/symbols/types/meaning-section.ts';

	type Props = {
		section: MeaningSection;
		number: number;
		pinsShown: boolean;
	};

	let { section, number, pinsShown }: Props = $props();
</script>

<section class="meaning" aria-labelledby="meaning-{section.meaning.id}">
	<h2 id="meaning-{section.meaning.id}">
		<span class="number">{number}</span>
		<span class="text">{section.meaning.text}</span>
	</h2>
	<div class="about">
		<ContextTags contexts={section.meaning.contexts} />
		{#if section.summary}
			<p class="summary">{section.summary}</p>
		{/if}
	</div>
	{#if section.details.length > 0}
		<SymbolDetails details={section.details} />
	{:else if pinsShown}
		<p class="empty">{m.symbols.view.noDetails}</p>
	{/if}
</section>

<style>
	.meaning {
		display: grid;
		gap: var(--spacing-4);
		padding: var(--spacing-8) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-3);
		font-weight: var(--font-weight-regular);
	}

	.number {
		min-width: var(--spacing-6);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.text {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		line-height: var(--line-height-2xl);
	}

	.about {
		display: grid;
		gap: var(--spacing-2);
		padding-inline-start: calc(var(--spacing-6) + var(--spacing-3));
	}

	.summary,
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	@media (max-width: 767.98px) {
		.text {
			font-size: var(--font-size-xl);
			line-height: var(--line-height-xl);
		}
	}
</style>
