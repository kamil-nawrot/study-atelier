<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
	import { symbolOf } from '#lib/exhibitions/editor/symbol-search/symbol-search.ts';
	import { loadSymbolCover } from '#lib/symbols/symbol-cover-data/symbol-cover-data.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

	type Props = {
		symbolId: string;
		meaningId?: string;
		symbols?: readonly SymbolOption[];
		linked?: boolean;
	};

	let { symbolId, meaningId, symbols, linked = false }: Props = $props();

	const symbol = $derived(symbolOf(symbols, symbolId));
	const chosen = $derived(symbol?.meanings.find((meaning) => meaning.id === meaningId));
	const meanings = $derived(chosen ? [chosen] : (symbol?.meanings ?? []));

	let loaded = $state<{ key: string; lens?: FragmentLens }>();

	const key = $derived(`${symbolId}|${symbol?.coverPinId ?? ''}|${chosen?.id ?? ''}`);
	const lens = $derived(loaded?.key === key ? loaded.lens : undefined);

	$effect(() => {
		const current = key;
		if (!symbol) return;
		let alive = true;
		void loadSymbolCover(symbol.id, symbol.coverPinId, chosen?.id).then((result) => {
			if (alive) loaded = { key: current, lens: result.lens };
		});
		return () => {
			alive = false;
		};
	});
</script>

<aside
	class="symbol"
	class:with-lens={lens !== undefined}
	aria-label={symbol ? m.exhibitions.blocks.symbolOf(symbol.name) : undefined}
>
	{#if symbol}
		{#if lens}
			<span class="cover"><DetailLens {lens} /></span>
		{/if}
		<div class="body">
			<span class="kind overline">
				<Icon icon={KeyRound} size="sm" />
				{m.symbols.view.overline}
			</span>
			<span class="name">{symbol.name}</span>
			{#if meanings.length > 0}
				<ol class="meanings">
					{#each meanings as meaning, index (meaning.id)}
						<li>
							{#if !chosen && meanings.length > 1}<span class="number">{index + 1}</span>{/if}<span
								class="text">{meaning.text}</span
							>
						</li>
					{/each}
				</ol>
			{/if}
			{#if linked}
				<a class="open" href={resolve('/(app)/atelier/glossary/symbols/[id]', { id: symbol.id })}>
					{m.symbols.card.open}
					<Icon icon={ArrowRight} size="sm" />
				</a>
			{/if}
		</div>
	{:else}
		<span class="gone">{m.symbols.card.deleted}</span>
	{/if}
</aside>

<style>
	.symbol {
		display: grid;
		gap: var(--spacing-6);
		align-items: start;
		box-sizing: border-box;
		width: 100%;
		max-width: var(--size-content-default);
		padding: var(--spacing-6);
		border: var(--border-width-hairline) solid var(--color-line);
		text-align: start;
	}

	.cover {
		--detail-lens: 160px;

		display: flex;
		justify-content: center;
	}

	.body {
		display: grid;
		gap: var(--spacing-2);
		justify-items: start;
		min-width: 0;
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

	.meanings {
		display: grid;
		gap: var(--spacing-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.number {
		padding-right: var(--spacing-2);
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}

	.text {
		font-style: italic;
	}

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
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

	.gone {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	@media (min-width: 768px) {
		.with-lens {
			grid-template-columns: auto minmax(0, 1fr);
		}
	}
</style>
