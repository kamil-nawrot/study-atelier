<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { chronological, orderBounds } from '#lib/review/order-guess/order-guess.ts';
	import { placeOf, yearsOf } from '#lib/review/year-guess/year-guess.ts';

	type Props = {
		artworks: WallArtwork[];
	};

	let { artworks }: Props = $props();

	let ordered = $derived(chronological(artworks));
	let bounds = $derived(orderBounds(artworks));

	function left(artwork: WallArtwork): string {
		return `${placeOf(yearsOf(artwork)?.[0] ?? bounds[0], bounds) * 100}%`;
	}
</script>

<div class="axis" aria-hidden="true">
	<div class="track">
		{#each ordered as artwork, index (artwork.id)}
			<span style:left={left(artwork)} class="point">{index + 1}</span>
		{/each}
	</div>
	<div class="ends">
		<span>{m.atelier.year(bounds[0], false)}</span>
		<span>{m.atelier.year(bounds[1], false)}</span>
	</div>
</div>

<style>
	.axis {
		display: grid;
		gap: var(--spacing-1);
		padding: 0 var(--spacing-3);
	}

	.track {
		position: relative;
		height: var(--spacing-8);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.point {
		position: absolute;
		bottom: calc(-1 * var(--spacing-3));
		display: grid;
		place-items: center;
		width: var(--spacing-6);
		height: var(--spacing-6);
		translate: -50% 0;
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-xs);
	}

	.ends {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-2);
		padding-top: var(--spacing-3);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
