<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';

	type Props = {
		symbol: AtlasSymbol;
	};

	let { symbol }: Props = $props();

	const emptyLens = { thumbnail: { left: 0, top: 0, width: 100, height: 100 } };
</script>

<a href={resolve('/(app)/atelier/glossary/symbols/[id]', { id: symbol.id })}>
	<span class="cover"><DetailLens lens={symbol.cover ?? emptyLens} /></span>
	<span class="name">{symbol.name}</span>
	<span class="counts">
		{m.symbols.details(symbol.pinCount)} · {m.symbols.meanings(symbol.meaningCount)}
	</span>
</a>

<style>
	a {
		display: grid;
		justify-items: center;
		gap: var(--spacing-1);
		color: var(--color-fg);
		text-align: center;
		text-decoration: none;
	}

	a:hover,
	a:focus-visible {
		--detail-lens-ring: var(--color-fg-muted);
	}

	.cover {
		padding-bottom: var(--spacing-2);
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.counts {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
	}
</style>
