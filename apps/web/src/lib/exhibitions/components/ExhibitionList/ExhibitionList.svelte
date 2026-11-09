<script lang="ts">
	import ExhibitionPoster from '#lib/exhibitions/components/ExhibitionPoster/ExhibitionPoster.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

	type Props = {
		exhibitions: readonly ExhibitionSummary[];
		covers: ReadonlyMap<string, WallArtwork>;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { exhibitions, covers, onimagefailed }: Props = $props();
</script>

<ul>
	{#each exhibitions as exhibition (exhibition.id)}
		<li>
			<ExhibitionPoster
				cover={exhibition.coverId ? covers.get(exhibition.coverId) : undefined}
				{exhibition}
				{onimagefailed}
			/>
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8) var(--spacing-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 768px) {
		ul {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
