<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { contextKey, contextKindName } from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

	type Props = {
		contexts: readonly SymbolContext[];
	};

	let { contexts }: Props = $props();

	function hrefOf(context: SymbolContext): ResolvedPathname | undefined {
		switch (context.kind) {
			case 'value':
				return valuePath(context.category, context.valueId);
			case 'era':
				return valuePath('era', context.eraCode);
			case 'artwork':
				return resolve('/(app)/atelier/[number]', { number: String(context.number) });
			case 'person':
				return resolve('/(app)/atelier/glossary/[id]', { id: context.entryId });
			case 'text':
				return undefined;
		}
	}
</script>

<ul class="tags">
	{#each contexts as context (contextKey(context))}
		{@const href = hrefOf(context)}
		{@const kind = contextKindName(context)}
		<li>
			{#if href}
				<a class="tag" {href}>
					{context.name}{#if kind}<span class="kind">{` · ${kind}`}</span>{/if}
				</a>
			{:else}
				<span class="tag">{context.name}</span>
			{/if}
		</li>
	{:else}
		<li class="general">{m.symbols.view.general}</li>
	{/each}
</ul>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		list-style: none;
	}

	.tag {
		display: inline-block;
		padding: 0 var(--spacing-2);
		background: var(--color-tag);
		color: var(--color-fg);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	a.tag:hover,
	a.tag:focus-visible {
		text-decoration: underline;
	}

	.kind {
		color: var(--color-fg-muted);
	}

	.general {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-sm);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
