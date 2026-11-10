<script lang="ts">
	import { untrack } from 'svelte';
	import { PopoverCard, PopoverState } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import EventCard from '#lib/timeline/components/EventCard/EventCard.svelte';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { View } from '#lib/timeline/types/view.ts';

	type Props = {
		event: TimelineEvent | undefined;
		anchor: HTMLElement | undefined;
		artworks: readonly WallArtwork[];
		boundary?: HTMLElement;
		view?: View;
		onclose: () => void;
		onartwork: (artwork: WallArtwork) => void;
		onwhole: (event: TimelineEvent) => void;
		ondelete: (event: TimelineEvent) => void;
	};

	let { event, anchor, artworks, boundary, view, onclose, onartwork, onwhole, ondelete }: Props =
		$props();

	const id = $props.id();
	const popover = new PopoverState();
	let card = $state<PopoverCard>();
	let wasOpen = false;

	$effect(() => {
		const target = anchor;
		if (event && target) {
			if (untrack(() => !popover.open || popover.anchor !== target)) popover.toggle(target);
		} else if (untrack(() => popover.open)) {
			popover.hide();
		}
	});

	$effect(() => {
		const open = popover.open;
		if (!open && wasOpen && untrack(() => event)) onclose();
		wasOpen = open;
	});

	$effect(() => {
		if (view && Number.isFinite(view.center + view.span) && untrack(() => popover.open)) {
			void card?.place();
		}
	});

	function act(action: () => void): void {
		const target = popover.anchor;
		popover.hide();
		target?.focus();
		action();
	}
</script>

<PopoverCard
	bind:this={card}
	id="{id}-card"
	{boundary}
	interactive
	labelledby="{id}-name"
	{popover}
>
	{#if event}
		{@const shown = event}
		<EventCard
			{artworks}
			compact
			event={shown}
			headingId="{id}-name"
			onartwork={(artwork) => act(() => onartwork(artwork))}
			ondelete={() => act(() => ondelete(shown))}
			onleave={() => act(() => {})}
			onwhole={() => act(() => onwhole(shown))}
		/>
	{/if}
</PopoverCard>
