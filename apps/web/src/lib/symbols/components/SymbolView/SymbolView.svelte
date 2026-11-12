<script lang="ts">
	import { Alert } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
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
</script>

<header class="head">
	<span class="overline">{m.symbols.view.overline}</span>
	<h1>{symbol.name}</h1>
</header>

{#if page.detailsError}
	<Alert tone="danger">{page.detailsError}</Alert>
{/if}

{#each page.sections as section, index (section.meaning.id)}
	<SymbolMeaningSection number={index + 1} pinsShown={!page.detailsError} {section} />
{/each}

{#if page.withoutMeaning.length > 0}
	<section class="rest" aria-labelledby="without-meaning">
		<h2 id="without-meaning">{m.symbols.view.withoutMeaning}</h2>
		<SymbolDetails details={page.withoutMeaning} />
	</section>
{/if}

<SymbolTimeline details={page.details} />

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
