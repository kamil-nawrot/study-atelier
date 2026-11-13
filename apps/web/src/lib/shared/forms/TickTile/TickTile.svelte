<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { Icon } from '@study-atelier/ui';

	type Props = HTMLLabelAttributes & {
		checked: boolean;
		ontoggle: () => void;
		framed?: boolean;
		picture: Snippet;
		children: Snippet;
	};

	let { checked, ontoggle, framed = true, picture, children, ...rest }: Props = $props();
</script>

<label {...rest} class="tick" class:off={!checked}>
	<input class="visually-hidden" {checked} onchange={ontoggle} type="checkbox" />
	<span class="window" class:framed>
		<span class="picture">{@render picture()}</span>
		<span class="mark" aria-hidden="true">
			{#if checked}
				<Icon icon={Check} size="sm" />
			{/if}
		</span>
	</span>
	<span class="text">{@render children()}</span>
</label>

<style>
	.tick {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		min-width: 0;
		padding: var(--spacing-2) var(--spacing-2) var(--spacing-3);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
		cursor: pointer;
	}

	.tick:has(input:focus-visible) {
		outline: var(--border-width-heavy) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.window {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 1;
	}

	.window.framed {
		display: block;
		overflow: hidden;
		background: var(--color-mat-window);
	}

	.picture {
		display: grid;
		place-items: center;
	}

	.framed .picture,
	.framed .picture > :global(*) {
		width: 100%;
		height: 100%;
	}

	.framed .picture :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mark {
		position: absolute;
		top: var(--spacing-1);
		right: var(--spacing-1);
		display: grid;
		place-items: center;
		width: var(--spacing-6);
		height: var(--spacing-6);
		border: var(--border-width-hairline) solid var(--color-mat-badge-fg);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
	}

	.window:not(.framed) .mark {
		top: 0;
		right: 0;
	}

	.tick:not(.off) .mark {
		border-color: var(--color-mat-fg);
		background: var(--color-mat-fg);
		color: var(--color-mat-bg);
	}

	.text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		.picture,
		.text {
			transition: opacity var(--duration-short);
		}
	}

	.off .picture,
	.off .text {
		opacity: 0.4;
	}
</style>
