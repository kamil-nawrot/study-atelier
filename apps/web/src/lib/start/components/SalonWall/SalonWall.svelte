<script lang="ts">
	import { Frame } from '@study-atelier/ui';
	import type { AuthArtwork } from '#lib/auth/auth-artworks/auth-artworks.ts';
	import { commonsFileUrl } from '#lib/images/commons/commons.ts';

	type Props = {
		artworks: AuthArtwork[];
	};

	let { artworks }: Props = $props();

	const SALON_WIDTH = 500;
</script>

<ul class="salon" aria-hidden="true">
	{#each artworks as artwork (artwork.file)}
		<li class="place">
			<Frame>
				<img
					alt=""
					decoding="async"
					loading="lazy"
					src={commonsFileUrl(artwork.file, SALON_WIDTH)}
				/>
			</Frame>
		</li>
	{/each}
</ul>

<style>
	.salon {
		position: absolute;
		inset: calc(-1 * var(--spacing-12)) calc(-1 * var(--spacing-16));
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(90px, 1fr);
		grid-auto-flow: dense;
		gap: var(--spacing-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.place {
		display: grid;
		min-height: 0;
	}

	.place:nth-child(n + 21) {
		display: none;
	}

	.place:nth-child(7n + 1) {
		grid-column: span 2;
		grid-row: span 2;
	}

	.place:nth-child(5n + 3) {
		grid-row: span 2;
	}

	.place:nth-child(9n + 4) {
		grid-column: span 2;
	}

	.place :global(.frame) {
		box-sizing: border-box;
		height: 100%;
		overflow: hidden;
	}

	.place img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (min-width: 768px) {
		.salon {
			grid-template-columns: repeat(8, minmax(0, 1fr));
			grid-auto-rows: minmax(120px, 1fr);
			gap: var(--spacing-6);
		}

		.place:nth-child(n + 21) {
			display: grid;
		}
	}
</style>
