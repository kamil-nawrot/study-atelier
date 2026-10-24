<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName
	} from '#lib/glossary/categories/categories.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

	type Props = {
		entry: GlossaryEntry;
		linked?: boolean;
	};

	let { entry, linked = false }: Props = $props();
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
{#if linked}
	<a class="open" href={resolve('/(app)/atelier/glossary/[id]', { id: entry.id })}>
		{m.glossary.card.open}
		<Icon icon={ArrowRight} size="sm" />
	</a>
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

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
		padding-top: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-line);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	.open:hover {
		text-decoration: underline;
	}
</style>
