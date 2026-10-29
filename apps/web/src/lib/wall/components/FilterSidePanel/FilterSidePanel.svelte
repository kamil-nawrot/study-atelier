<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import { MediaQuery } from 'svelte/reactivity';
	import { Button, Icon, overlayScrollbar } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		open: boolean;
		summary: string;
		filtering: boolean;
		onclear: () => void;
		children: Snippet;
	};

	let { open = $bindable(), summary, filtering, onclear, children }: Props = $props();

	let mounted = $state(false);

	const motion = new MediaQuery('prefers-reduced-motion: no-preference');

	$effect(() => {
		if (open) mounted = true;
		else if (!motion.current) mounted = false;
	});

	function unmount(event: TransitionEvent): void {
		if (event.propertyName === 'width' && !open) mounted = false;
	}
</script>

<div class="slot filter-panel" class:open ontransitionend={unmount}>
	{#if mounted}
		<aside class="filters" {@attach overlayScrollbar()} aria-label={m.atelier.filters.title}>
			<div class="top">
				<h2>{m.atelier.filters.title}</h2>
				<button
					class="close"
					aria-label={m.atelier.filters.closePanel}
					onclick={() => (open = false)}
					type="button"
				>
					<Icon icon={X} />
				</button>
			</div>
			{@render children()}
			<div class="bottom">
				<span class="caption">{summary}</span>
				<Button disabled={!filtering} onclick={onclear}>
					{m.atelier.filters.clear}
				</Button>
			</div>
		</aside>
	{/if}
</div>

<style>
	.slot {
		position: sticky;
		top: var(--bar-height);
		flex: none;
		width: 0;
		overflow: hidden;
		visibility: hidden;
	}

	.slot.open {
		width: var(--filter-panel-width);
		visibility: visible;
	}

	.filters {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
		box-sizing: border-box;
		width: var(--filter-panel-width);
		max-height: calc(100dvh - var(--bar-height));
		padding: 0 var(--spacing-6) var(--spacing-12);
		overflow-y: auto;
		border-left: var(--border-width-base) solid var(--color-line);
	}

	@media (prefers-reduced-motion: no-preference) {
		.slot {
			transition:
				width var(--duration-short) ease-out,
				visibility var(--duration-short);
		}
	}

	.top {
		position: sticky;
		top: 0;
		z-index: 1;
		padding-block: var(--spacing-4);
		background: var(--color-bg);
	}

	.top,
	.bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
	}

	.top h2 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.close {
		display: flex;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}
</style>
