<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import TimelineFilterPanel from '#lib/timeline/components/TimelineFilterPanel/TimelineFilterPanel.svelte';
	import { emptyTimelineFilter } from '#lib/timeline/filter/filter.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		era: EraCode;
		matching: number;
		filtering: boolean;
		open: boolean;
		filter: TimelineFilter;
		showEvents: boolean;
		readingArtworks: boolean;
	};

	let {
		artworks,
		era,
		matching,
		filtering,
		open = $bindable(),
		filter = $bindable(),
		showEvents = $bindable(),
		readingArtworks = $bindable()
	}: Props = $props();
</script>

<Dialog title={m.atelier.filters.title} bind:open>
	<TimelineFilterPanel {artworks} {era} bind:filter bind:readingArtworks bind:showEvents />
	{#snippet footer()}
		<Button disabled={!filtering} onclick={() => (filter = emptyTimelineFilter())}>
			{m.atelier.filters.clear}
		</Button>
		<Button onclick={() => (open = false)} variant="primary">
			{m.atelier.filters.showResults(matching)}
		</Button>
	{/snippet}
</Dialog>
