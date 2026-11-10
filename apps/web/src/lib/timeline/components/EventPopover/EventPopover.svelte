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
	let outside = $state(false);
	let dismissed = $state<string>();
	let wasOpen = false;

	$effect(() => {
		const target = anchor;
		const current = event?.id;
		if (current === undefined) {
			untrack(() => {
				dismissed = undefined;
				if (popover.open) popover.hide();
			});
			return;
		}
		untrack(() => {
			if (dismissed !== undefined && dismissed !== current) dismissed = undefined;
			if (dismissed === current || !target) return;
			if (!popover.open || popover.anchor !== target) popover.toggle(target);
		});
	});

	$effect(() => {
		const open = popover.open;
		if (!open && wasOpen && untrack(() => event && event.id !== dismissed)) onclose();
		wasOpen = open;
	});

	$effect(() => {
		const moved = view ? view.center + view.span : 0;
		if (!Number.isFinite(moved)) return;
		outside = anchor && boundary ? !within(anchor, boundary) : false;
		if (untrack(() => popover.open)) void card?.place();
	});

	function within(target: HTMLElement, area: HTMLElement): boolean {
		const box = target.getBoundingClientRect();
		const bounds = area.getBoundingClientRect();
		return (
			box.right > bounds.left &&
			box.left < bounds.right &&
			box.bottom > bounds.top &&
			box.top < bounds.bottom
		);
	}

	function act(action: () => void, keep = false): void {
		const target = popover.anchor;
		if (keep) dismissed = event?.id;
		popover.hide();
		target?.focus();
		action();
	}
</script>

<PopoverCard
	bind:this={card}
	id="{id}-card"
	{boundary}
	concealed={!anchor || outside}
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
			onwhole={() => act(() => onwhole(shown), true)}
		/>
	{/if}
</PopoverCard>
