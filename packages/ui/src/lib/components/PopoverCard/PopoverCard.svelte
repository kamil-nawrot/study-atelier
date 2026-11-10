<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import type { PopoverState } from '../../popover-state/popover-state.svelte';

	type Props = {
		id: string;
		popover: PopoverState;
		interactive?: boolean;
		labelledby?: string;
		boundary?: HTMLElement;
		concealed?: boolean;
		children: Snippet;
	};

	let {
		id,
		popover,
		interactive = false,
		labelledby,
		boundary,
		concealed = false,
		children
	}: Props = $props();

	let card: HTMLDivElement | undefined = $state();
	let top = $state(0);
	let left = $state(0);

	export async function place(): Promise<void> {
		await tick();
		const anchor = popover.anchor;
		if (!anchor || !card) return;
		const anchorBox = anchor.getBoundingClientRect();
		const box = card.getBoundingClientRect();
		const margin = parseFloat(getComputedStyle(card).getPropertyValue('--popover-margin')) || 0;
		const { clientWidth: width, clientHeight: height } = document.documentElement;
		const bounds = boundary?.getBoundingClientRect();
		const from = Math.max(margin, bounds ? bounds.left + margin : 0);
		const to = Math.min(width - margin, bounds ? bounds.right - margin : width);
		const start = Math.max(anchorBox.left, from);
		const below = anchorBox.bottom + margin;
		const fitsBelow = below + box.height <= height - margin;
		const fitsRight = start + box.width <= to;
		top = fitsBelow ? below : Math.max(margin, anchorBox.top - margin - box.height);
		const inBounds = Math.max(
			from,
			Math.min(fitsRight ? start : Math.min(anchorBox.right, to) - box.width, to - box.width)
		);
		left = Math.max(margin, Math.min(inBounds, width - margin - box.width));
	}

	$effect(() => {
		popover.card = card;
		popover.interactive = interactive;
	});

	$effect(() => {
		if (popover.open && popover.anchor) void place();
	});

	$effect(() => {
		if (!card || !popover.open || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => void place());
		observer.observe(card);
		return () => observer.disconnect();
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
	class:interactive
	aria-labelledby={interactive ? labelledby : undefined}
	hidden={!popover.open || concealed}
	onfocusout={(event) => popover.blur(event)}
	onpointerenter={(event) => popover.cardPointerEnter(event)}
	onpointerleave={(event) => popover.pointerLeave(event)}
	role={interactive ? 'dialog' : 'tooltip'}
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
		font-family: var(--font-family-ui), system-ui, sans-serif;
		font-size: var(--font-size-md);
		font-style: normal;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-md);
		text-align: left;
		white-space: normal;
		pointer-events: none;
	}

	.interactive {
		pointer-events: auto;
	}

	.card[hidden] {
		display: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.card {
			animation: enter var(--duration-short) ease-out;
		}
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(var(--spacing-1));
		}
	}
</style>
