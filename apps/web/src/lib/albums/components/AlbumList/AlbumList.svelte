<script lang="ts">
	import BookImage from '@lucide/svelte/icons/book-image';
	import { EmptyState } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import CardIndexEra from '#lib/card-index/components/CardIndexEra/CardIndexEra.svelte';
	import CardIndexEraAxis from '#lib/card-index/components/CardIndexEraAxis/CardIndexEraAxis.svelte';
	import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import AlbumCard from '#lib/albums/components/AlbumCard/AlbumCard.svelte';
	import type { ListedAlbum } from '#lib/albums/types/listed-album.ts';
	import { albumsByEra } from '#lib/albums/album-summary/album-summary.ts';

	type Props = {
		albums: ListedAlbum[];
	};

	let { albums }: Props = $props();

	const FOLDING_KEYS = {
		folded: 'study-atelier:albums-folded-eras',
		open: 'study-atelier:albums-open-periods'
	};

	const folding = new TimelineFolding(
		() => ({ query: '', matched: [], periods: [] }),
		FOLDING_KEYS
	);

	let eras = $derived(albumsByEra(albums));
</script>

{#if albums.length === 0}
	<EmptyState icon={BookImage} text={m.albums.empty} />
{:else}
	<CardIndexEraAxis>
		{#each eras as era (era.code)}
			<CardIndexEra code={era.code} empty={m.albums.empty} filled {folding}>
				<ul class="cards">
					{#each era.albums as listed (listed.album.slug)}
						<AlbumCard {listed} />
					{/each}
				</ul>
			</CardIndexEra>
		{/each}
	</CardIndexEraAxis>
{/if}

<style>
	.cards {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8) var(--spacing-6);
		padding-block: var(--spacing-4);
		list-style: none;
	}

	@media (min-width: 768px) {
		.cards {
			grid-template-columns: repeat(auto-fill, minmax(calc(var(--spacing-12) * 5), 1fr));
		}
	}
</style>
