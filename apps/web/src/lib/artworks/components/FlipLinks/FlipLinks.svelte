<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { FLIP_DIRECTIONS } from '#lib/wall/flip/flip.ts';
	import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		links: Record<FlipDirection, ResolvedPathname | null>;
	};

	let { links }: Props = $props();
</script>

{#each FLIP_DIRECTIONS as direction (direction)}
	{@const href = links[direction]}
	{@const icon = direction === 'previous' ? ChevronLeft : ChevronRight}
	{#if href}
		<a
			class="flip {direction}"
			aria-label={m.artworkView[direction]}
			data-sveltekit-replacestate
			data-sveltekit-reset="false"
			{href}
		>
			<Icon {icon} />
		</a>
	{:else}
		<span class="flip {direction} end" aria-hidden="true">
			<Icon {icon} />
		</span>
	{/if}
{/each}

<style>
	.flip {
		position: absolute;
		top: 50%;
		z-index: 2;
		display: flex;
		padding: var(--spacing-3) var(--spacing-1);
		color: var(--color-stage-fg);
		opacity: 0.6;
		translate: 0 -50%;
	}

	.previous {
		left: 0;
	}

	.next {
		right: 0;
	}

	a.flip:hover,
	a.flip:focus-visible {
		opacity: 1;
	}

	.flip.end {
		opacity: 0.2;
	}

	@media (min-width: 768px) {
		.flip {
			padding: var(--spacing-3);
		}
	}
</style>
