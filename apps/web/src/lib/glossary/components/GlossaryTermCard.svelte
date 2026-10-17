<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { glossaryCategoryIcon, glossaryCategoryName } from '../categories.ts';
	import type { GlossaryEntry } from '../types.ts';

	type Props = {
		entry: GlossaryEntry;
	};

	let { entry }: Props = $props();
</script>

<span class="kind">
	<Icon icon={glossaryCategoryIcon(entry.category)} size="sm" />
	{glossaryCategoryName(entry.category)}
</span>
<span class="name">{entry.name}</span>
{#if entry.definition}
	<span class="definition">{entry.definition}</span>
{/if}
{#if entry.source}
	<span class="source">{m.glossary.card.source}</span>
{/if}

<style>
	.kind {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.definition {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: pre-line;
	}

	.source {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
