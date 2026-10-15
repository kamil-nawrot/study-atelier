<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		content: Snippet;
	};

	let { children, content }: Props = $props();

	const id = $props.id();
	const cardId = `${id}-card`;

	let trigger: HTMLButtonElement | undefined = $state();
	let card: HTMLDivElement | undefined = $state();
	let open = $state(false);
	let pinned = false;
	let top = $state(0);
	let left = $state(0);

	async function place(): Promise<void> {
		await tick();
		if (!trigger || !card) return;
		const anchor = trigger.getBoundingClientRect();
		const box = card.getBoundingClientRect();
		const margin = parseFloat(getComputedStyle(card).getPropertyValue('--popover-margin')) || 0;
		const below = anchor.bottom + margin;
		const fitsBelow = below + box.height <= window.innerHeight - margin;
		top = fitsBelow ? below : Math.max(margin, anchor.top - margin - box.height);
		left = Math.min(Math.max(margin, anchor.left), window.innerWidth - margin - box.width);
	}

	function show(): void {
		open = true;
		void place();
	}

	function hide(): void {
		open = false;
		pinned = false;
	}

	function toggle(): void {
		pinned = !pinned || !open;
		if (pinned) show();
		else hide();
	}

	function onpointerenter(event: PointerEvent): void {
		if (event.pointerType === 'mouse') show();
	}

	function onpointerleave(event: PointerEvent): void {
		if (event.pointerType === 'mouse' && !pinned) open = false;
	}

	function onfocus(): void {
		if (trigger?.matches(':focus-visible')) show();
	}

	function onblur(): void {
		if (!pinned) open = false;
	}

	function onwindowpointerdown(event: PointerEvent): void {
		if (open && trigger && !trigger.contains(event.target as Node)) hide();
	}

	function onwindowkeydown(event: KeyboardEvent): void {
		if (open && event.key === 'Escape') hide();
	}

	function onwindowchange(): void {
		if (open) void place();
	}
</script>

<svelte:window
	onkeydown={onwindowkeydown}
	onpointerdown={onwindowpointerdown}
	onresize={onwindowchange}
	onscrollcapture={onwindowchange}
/>

<span class="popover">
	<button
		bind:this={trigger}
		class="trigger"
		aria-controls={cardId}
		aria-describedby={open ? cardId : undefined}
		aria-expanded={open}
		{onblur}
		onclick={toggle}
		{onfocus}
		{onpointerenter}
		{onpointerleave}
		type="button"
	>
		{@render children()}
	</button>
	<div
		bind:this={card}
		id={cardId}
		style:top="{top}px"
		style:left="{left}px"
		class="card"
		hidden={!open}
		role="tooltip"
	>
		{@render content()}
	</div>
</span>

<style>
	.popover {
		--popover-margin: var(--spacing-2);
		display: inline-flex;
	}

	.trigger {
		display: inline-flex;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: inherit;
		cursor: pointer;
	}

	.trigger:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.card {
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
