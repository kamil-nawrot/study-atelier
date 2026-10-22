<script lang="ts">
	import { untrack } from 'svelte';
	import type { CollectionFilter, OwnFieldDefinition, WallArtwork } from '#lib/collection/types.ts';
	import FilterPanel from '#lib/collection/components/FilterPanel.svelte';

	type Props = {
		artworks: WallArtwork[];
		initial: CollectionFilter;
		report: (filter: CollectionFilter) => void;
		ownFields?: OwnFieldDefinition[];
	};

	let { artworks, initial, report, ownFields }: Props = $props();

	let filter = $state(untrack(() => initial));

	$effect(() => report(filter));
</script>

<FilterPanel {artworks} {ownFields} bind:filter />
