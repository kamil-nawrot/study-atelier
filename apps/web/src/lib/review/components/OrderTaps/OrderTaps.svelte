<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { orderPlaces, tapped } from '#lib/review/order-guess/order-guess.ts';
	import OrderTile from '#lib/review/components/OrderTile/OrderTile.svelte';

	type Props = {
		artworks: WallArtwork[];
		answered?: boolean;
		onchange: (artworks: WallArtwork[] | undefined) => void;
	};

	let { artworks, answered = false, onchange }: Props = $props();

	let picked = $state<string[]>([]);

	let places = $derived(answered ? orderPlaces(artworks) : undefined);

	function tap(artwork: WallArtwork): void {
		if (answered) return;
		picked = tapped(picked, artwork.id);
		onchange(
			picked.length === artworks.length
				? picked.map((id) => artworks.find((one) => one.id === id) as WallArtwork)
				: undefined
		);
	}

	function numberOf(artwork: WallArtwork): number | null {
		const at = picked.indexOf(artwork.id);
		return at < 0 ? null : at + 1;
	}
</script>

<ol class="taps">
	{#each artworks as artwork, index (artwork.id)}
		{@const number = answered ? index + 1 : numberOf(artwork)}
		<li>
			<button
				class="tap"
				class:picked={number !== null}
				aria-label={answered
					? undefined
					: number === null
						? m.review.quiz.imageAlt(index + 1)
						: m.review.order.place(number, artworks.length)}
				aria-pressed={!answered && number !== null}
				disabled={answered}
				onclick={() => tap(artwork)}
				type="button"
			>
				<OrderTile {artwork} {index} {number} place={places?.[index]} />
			</button>
		</li>
	{/each}
</ol>

<style>
	.taps {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-3);
		width: 100%;
		margin: 0;
		list-style: none;
	}

	.tap {
		display: grid;
		width: 100%;
		height: 100%;
		padding: var(--spacing-1);
		border: var(--border-width-button) solid transparent;
		background: transparent;
		cursor: pointer;
	}

	.tap.picked {
		border-color: var(--color-highlight);
	}

	.tap:disabled {
		cursor: default;
	}

	.tap:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.tap :global([data-grip]) {
		display: none;
	}

	.tap :global(.window img) {
		max-height: 15svh;
	}
</style>
