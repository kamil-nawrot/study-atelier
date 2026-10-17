<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import type { PopoverState } from '../popover-state.svelte';

	type Props = {
		id: string;
		popover: PopoverState;
		children: Snippet;
	};

	let { id, popover, children }: Props = $props();

	let card: HTMLDivElement | undefined = $state();
	let top = $state(0);
	let left = $state(0);

	async function place(): Promise<void> {
		await tick();
		const anchor = popover.anchor;
		if (!anchor || !card) return;
		const anchorBox = anchor.getBoundingClientRect();
		const box = card.getBoundingClientRect();
		const margin = parseFloat(getComputedStyle(card).getPropertyValue('--popover-margin')) || 0;
		const { clientWidth: width, clientHeight: height } = document.documentElement;
		const below = anchorBox.bottom + margin;
		const fitsBelow = below + box.height <= height - margin;
		const fitsRight = anchorBox.left + box.width <= width - margin;
		top = fitsBelow ? below : Math.max(margin, anchorBox.top - margin - box.height);
		left = Math.min(
			Math.max(margin, fitsRight ? anchorBox.left : anchorBox.right - box.width),
			width - margin - box.width
		);
	}

	$effect(() => {
		if (popover.open && popover.anchor) void place();
	});

	function onwindowchange(): void {
		if (popover.open) void place();
	}
</script>

<svelte:window
	onkeydown={(event) => popover.keyDown(event)}
	onpointerdown={(event) => popover.pointerDown(event)}
	onresize={onwindowchange}
	onscrollcapture={onwindowchange}
/>

<div
	bind:this={card}
	{id}
	style:top="{top}px"
	style:left="{left}px"
	class="card"
	hidden={!popover.open}
	role="tooltip"
>
	{@render children()}
</div>

<style>
	.card {
		--popover-margin: var(--spacing-2);
		position: fixed;
		z-index: 2;
		display: grid;
		gap: var(--spacing-1);
		width: max-content;
		max-width: min(var(--size-content-narrow), calc(100vw - 2 * var(--popover-margin)));
		padding: var(--spacing-3) var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		color: var(--color-fg);
		text-align: left;
		pointer-events: none;
	}

	.card[hidden] {
		display: none;
	}
</style>
