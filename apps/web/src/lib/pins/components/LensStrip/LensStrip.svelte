<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { IconButton } from '@study-atelier/ui';
	import type { Snippet } from 'svelte';

	type Props = {
		count: number;
		backLabel: string;
		forwardLabel: string;
		children: Snippet;
	};

	let { count, backLabel, forwardLabel, children }: Props = $props();

	let strip = $state<HTMLUListElement>();
	let atStart = $state(true);
	let atEnd = $state(true);

	function measure(): void {
		if (!strip) return;
		atStart = strip.scrollLeft <= 1;
		atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
	}

	$effect(() => {
		if (!strip) return;
		void count;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(strip);
		return () => observer.disconnect();
	});

	function scroll(direction: -1 | 1): void {
		strip?.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: 'smooth' });
	}
</script>

<div class="strip" class:scrolls={!atStart || !atEnd}>
	<span class="arrow">
		<IconButton
			disabled={atStart}
			icon={ChevronLeft}
			label={backLabel}
			onclick={() => scroll(-1)}
		/>
	</span>
	<ul bind:this={strip} onscroll={measure}>
		{@render children()}
	</ul>
	<span class="arrow">
		<IconButton
			disabled={atEnd}
			icon={ChevronRight}
			label={forwardLabel}
			onclick={() => scroll(1)}
		/>
	</span>
</div>

<style>
	.strip {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: var(--spacing-4);
	}

	.arrow {
		display: none;
		padding-top: calc(var(--detail-lens) / 2 - var(--size-control) / 2);
	}

	ul {
		display: flex;
		gap: var(--spacing-6);
		overflow-x: auto;
		padding: 0 0 var(--spacing-2);
		list-style: none;
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
	}

	ul > :global(li) {
		flex: 0 0 var(--detail-lens);
		scroll-snap-align: start;
	}

	@media (min-width: 768px) {
		.strip.scrolls {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}

		.strip.scrolls .arrow {
			display: block;
		}
	}
</style>
