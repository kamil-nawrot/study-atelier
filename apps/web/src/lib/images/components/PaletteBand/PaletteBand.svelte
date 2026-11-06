<script lang="ts">
	import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';
	import { PALETTE_LABELLED_SHARE } from '#lib/images/palette/palette.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		colours: PaletteColour[];
		collecting: boolean;
	};

	let { colours, collecting }: Props = $props();
</script>

<div class="band">
	{#if collecting}
		<p class="collecting">{m.palette.collecting}</p>
	{:else}
		<ul aria-label={m.palette.label}>
			{#each colours as colour (colour.color)}
				<li
					style:flex-grow={colour.share}
					aria-label={m.palette.colour(colour.color, Math.round(colour.share * 100))}
				>
					<span style:background={colour.color} class="swatch"></span>
					<span class="hex">{colour.share > PALETTE_LABELLED_SHARE ? colour.color : ''}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.band {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		padding: var(--spacing-3);
		background: var(--color-palette-band);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	ul {
		display: flex;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		flex-basis: 0;
		min-width: 0;
		gap: var(--spacing-1);
		text-align: center;
	}

	.swatch {
		display: block;
		height: var(--spacing-6);
	}

	.hex {
		min-height: 1lh;
		overflow: hidden;
		white-space: nowrap;
	}

	.collecting {
		margin: 0;
		text-align: center;
	}
</style>
