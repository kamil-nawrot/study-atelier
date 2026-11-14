<script lang="ts">
	import { resolve } from '$app/paths';
	import { Icon, SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { matchingSymbols } from '#lib/exhibitions/editor/symbol-search/symbol-search.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

	type Props = {
		symbols: readonly SymbolOption[];
		onpick: (symbol: SymbolOption) => void;
		ondrag?: (event: PointerEvent, symbol: SymbolOption) => void;
	};

	let { symbols, onpick, ondrag }: Props = $props();

	let query = $state('');

	let shown = $derived(matchingSymbols(symbols, query));
	let status = $derived.by(() => {
		if (symbols.length === 0) return m.exhibitions.panel.noSymbols;
		if (query.trim() === '') return m.exhibitions.panel.symbolsByName;
		return shown.length > 0
			? m.exhibitions.panel.found(shown.length)
			: m.exhibitions.panel.noSymbol;
	});
</script>

{#if symbols.length > 0}
	<SearchField
		label={m.exhibitions.panel.searchSymbol}
		placeholder={m.exhibitions.panel.searchSymbolPlaceholder}
		bind:value={query}
	/>
{/if}
<p class="caption">{status}</p>
{#if shown.length > 0}
	<ul class="terms">
		{#each shown as symbol (symbol.id)}
			<li>
				<button
					class="term"
					onclick={() => onpick(symbol)}
					onpointerdown={(event) => ondrag?.(event, symbol)}
					type="button"
				>
					<span class="category">
						<Icon icon={KeyRound} size="sm" />
					</span>
					<span class="name">{symbol.name}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
<a
	class="browse"
	href="{resolve('/(app)/atelier/glossary')}?tab=symbols"
	rel="external noopener"
	target="_blank"
>
	{m.exhibitions.panel.browseSymbols}
</a>

<style>
	.caption {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.terms {
		display: grid;
		margin: 0;
		padding: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	.term {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: 0;
		border: none;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: grab;
	}

	.term:hover .name {
		text-decoration: underline;
	}

	.category {
		display: inline-flex;
		color: var(--color-fg-muted);
	}

	.name {
		overflow: hidden;
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.browse {
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
