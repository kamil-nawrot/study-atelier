<script lang="ts">
	import { Tag } from '@study-atelier/ui';
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

{#snippet label(context: SymbolContext)}
	{@const kind = contextKindName(context)}
	{context.name}{#if kind}<span class="kind">{` · ${kind}`}</span>{/if}
{/snippet}

{#if contexts.length > 0}
	<div class="contexts">
		<p class="overline">{m.symbols.view.context}</p>
		<ul class="tags">
			{#each contexts as context (contextKey(context))}
				{@const href = hrefOf(context)}
				<li>
					{#if href}
						<a {href}><Tag>{@render label(context)}</Tag></a>
					{:else}
						<Tag>{@render label(context)}</Tag>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="overline">{m.symbols.view.general}</p>
{/if}

<style>
	.contexts {
		display: grid;
		gap: var(--spacing-2);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		list-style: none;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	a:hover,
	a:focus-visible {
		text-decoration: underline;
	}

	.kind {
		color: var(--color-fg-muted);
	}
</style>
