<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition';

	type Props = {
		duration?: number;
		offset?: number;
	};

	const LEAVE_GRACE = 1000;

	let { duration = 5000, offset = 0 }: Props = $props();

	let message = $state('');
	let key = $state(0);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let remaining = 0;
	let startedAt = 0;

	export function show(text: string): void {
		message = text;
		key += 1;
		remaining = duration;
		start();
	}

	function start(): void {
		clearTimeout(timer);
		startedAt = Date.now();
		timer = setTimeout(hide, remaining);
	}

	function pause(event: PointerEvent): void {
		if (!message || event.pointerType !== 'mouse') return;
		clearTimeout(timer);
		remaining = Math.max(0, remaining - (Date.now() - startedAt));
	}

	function resume(event: PointerEvent): void {
		if (!message || event.pointerType !== 'mouse') return;
		remaining = Math.min(remaining, LEAVE_GRACE);
		start();
	}

	function hide(): void {
		clearTimeout(timer);
		message = '';
	}

	$effect(() => () => clearTimeout(timer));

	function leave(node: HTMLElement): TransitionConfig {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const length = parseFloat(getComputedStyle(node).getPropertyValue('--duration-short')) || 0;
		return {
			duration: reduced ? 0 : length,
			css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * 4}px)`
		};
	}
</script>

<div style:--toast-offset="{offset}px" class="region" role="status">
	{#key key}
		{#if message}
			<div
				class="toast"
				onpointerenter={pause}
				onpointerleave={resume}
				role="presentation"
				out:leave
			>
				{message}
			</div>
		{/if}
	{/key}
</div>

<style>
	.region {
		position: fixed;
		right: var(--spacing-4);
		bottom: calc(var(--toast-offset) + var(--spacing-4));
		left: var(--spacing-4);
		z-index: 2;
		display: grid;
		justify-items: center;
		pointer-events: none;
	}

	.toast {
		grid-area: 1 / 1;
		width: 100%;
		padding: var(--spacing-3) var(--spacing-4);
		border-bottom: var(--border-width-button) solid var(--color-fg-muted);
		border-radius: var(--border-radius-none);
		background: var(--color-fg);
		color: var(--color-on-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		pointer-events: auto;
	}

	@media (min-width: 768px) {
		.toast {
			width: auto;
			max-width: var(--size-content-narrow);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.toast {
			animation: enter var(--duration-short) ease-out calc(var(--duration-short) / 2) backwards;
		}
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(var(--spacing-2));
		}
	}
</style>
