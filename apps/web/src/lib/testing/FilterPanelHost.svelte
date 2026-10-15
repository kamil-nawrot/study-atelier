<script lang="ts">
	import { untrack } from 'svelte';
	import type { CollectionFilter, WallArtwork } from '#lib/collection/types.ts';
	import FilterPanel from '#lib/collection/components/FilterPanel.svelte';

	type Props = {
		artworks: WallArtwork[];
		initial: CollectionFilter;
		report: (filter: CollectionFilter) => void;
	};

	let { artworks, initial, report }: Props = $props();

	let filter = $state(untrack(() => initial));

	$effect(() => report(filter));
</script>

<FilterPanel {artworks} bind:filter />
