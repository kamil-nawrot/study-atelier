<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import {
		glossaryCategoryIcon,
		glossaryCategoryName
	} from '#lib/glossary/categories/categories.ts';
	import { leadSentences } from '#lib/glossary/glossary/glossary.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

	type Props = {
		entry: GlossaryEntry;
	};

	let { entry }: Props = $props();
</script>

<a href={resolve('/(app)/atelier/glossary/[id]', { id: entry.id })}>
	<span class="head">
		<span class="name">{entry.name}</span>
		<span class="category">
			<Icon icon={glossaryCategoryIcon(entry.category)} size="sm" />
			{glossaryCategoryName(entry.category)}
		</span>
	</span>
	{#if entry.definition}
		<span class="sentence">{leadSentences(entry.definition)}</span>
	{/if}
</a>

<style>
	a {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-3);
		color: var(--color-fg);
		text-decoration: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		a {
			transition: background var(--duration-short) ease-out;
		}
	}

	a:hover {
		background: var(--color-tag);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-3);
	}

	.name {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	.category {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-1);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.category :global(svg) {
		align-self: center;
	}

	.sentence {
		display: -webkit-box;
		overflow: hidden;
		color: var(--color-fg-muted);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
</style>
