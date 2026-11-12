<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Plus from '@lucide/svelte/icons/plus';
	import { Alert, Button, EmptyState, Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		rememberedSymbolSort,
		rememberSymbolSort,
		shownSymbols,
		SYMBOL_SORTS,
		type SymbolSort
	} from '#lib/symbols/atlas/atlas.ts';
	import SymbolTile from '#lib/symbols/components/SymbolTile/SymbolTile.svelte';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
	import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';

	type Props = {
		symbols: AtlasSymbol[];
		error?: string;
		query?: string;
	};

	let { symbols, error, query = $bindable('') }: Props = $props();

	let sort = $state<SymbolSort>(rememberedSymbolSort());

	const options = SYMBOL_SORTS.map((value) => ({ value, label: m.symbols.sorts[value] }));

	let shown = $derived(shownSymbols(symbols, query, sort));

	function choose(value: string): void {
		sort = SYMBOL_SORTS.find((known) => known === value) ?? 'name';
		rememberSymbolSort(sort);
	}
</script>

{#if error}
	<Alert title={m.symbols.loadErrorTitle} tone="danger">
		{error}
	</Alert>
{:else if symbols.length === 0}
	<EmptyState icon={KeyRound} text={m.symbols.empty} title={m.symbols.emptyTitle}>
		<Button href={resolve('/(app)/atelier/glossary/symbols/new')}>
			<Icon icon={Plus} />
			{m.symbols.addFirst}
		</Button>
	</EmptyState>
{:else}
	<div class="tools">
		<ListTools
			{options}
			searchLabel={m.symbols.search}
			sortLabel={m.symbols.sortLabel}
			bind:query
			bind:sort={() => sort, choose}
		>
			{#snippet actions()}
				<Button
					aria-label={m.symbols.add}
					compact
					href={resolve('/(app)/atelier/glossary/symbols/new')}
					icon={Plus}
					variant="primary"
				>
					{m.symbols.add}
				</Button>
			{/snippet}
		</ListTools>
	</div>

	{#if shown.length === 0}
		<p class="lead">{m.symbols.noResults(query.trim())}</p>
	{:else}
		<ul class="grid">
			{#each shown as symbol (symbol.id)}
				<li><SymbolTile {symbol} /></li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.tools {
		margin-bottom: var(--spacing-6);
	}

	.grid {
		--detail-lens: 152px;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-12) var(--spacing-6);
		padding: 0;
		list-style: none;
	}

	@media (min-width: 768px) {
		.grid {
			--detail-lens: 200px;

			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: var(--spacing-16);
			max-width: var(--size-content-wide);
		}
	}
</style>
