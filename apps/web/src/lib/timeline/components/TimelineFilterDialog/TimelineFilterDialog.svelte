<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import TimelineFilterPanel from '#lib/timeline/components/TimelineFilterPanel/TimelineFilterPanel.svelte';
	import { emptyTimelineFilter } from '#lib/timeline/filter/filter.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		matching: number;
		filtering: boolean;
		open: boolean;
		filter: TimelineFilter;
		showEvents: boolean;
		showSpans: boolean;
	};

	let {
		artworks,
		matching,
		filtering,
		open = $bindable(),
		filter = $bindable(),
		showEvents = $bindable(),
		showSpans = $bindable()
	}: Props = $props();
</script>

<Dialog title={m.atelier.filters.title} bind:open>
	<TimelineFilterPanel {artworks} bind:filter bind:showEvents bind:showSpans />
	{#snippet footer()}
		<Button disabled={!filtering} onclick={() => (filter = emptyTimelineFilter())}>
			{m.atelier.filters.clear}
		</Button>
		<Button onclick={() => (open = false)} variant="primary">
			{m.atelier.filters.showResults(matching)}
		</Button>
	{/snippet}
</Dialog>
