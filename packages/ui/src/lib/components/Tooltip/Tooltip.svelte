<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		text: string;
		placement?: 'top' | 'bottom' | 'left';
		align?: 'start' | 'end';
		children: Snippet<[string]>;
	};

	let { text, placement = 'top', align = 'start', children }: Props = $props();

	const id = $props.id();
</script>

<span class="tooltip">
	{@render children(id)}
	<span
		{id}
		class="bubble"
		class:below={placement === 'bottom'}
		class:end={align === 'end'}
		class:left={placement === 'left'}
		role="tooltip">{text}</span
	>
</span>

<style>
	.tooltip {
		position: relative;
		display: inline-flex;
	}

	.bubble {
		position: absolute;
		bottom: calc(100% + var(--spacing-2));
		left: 0;
		z-index: 1;
		width: max-content;
		max-width: min(var(--size-content-narrow), calc(100vw - var(--spacing-12)));
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-bg);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		visibility: hidden;
		pointer-events: none;
	}

	.bubble.below {
		top: calc(100% + var(--spacing-2));
		bottom: auto;
	}

	.bubble.left {
		top: 50%;
		right: calc(100% + var(--spacing-2));
		bottom: auto;
		left: auto;
		translate: 0 -50%;
	}

	.bubble.end {
		right: 0;
		left: auto;
	}

	.tooltip:hover .bubble,
	.tooltip:has(:global(:focus-visible)) .bubble {
		visibility: visible;
	}

	.tooltip:has(:global([aria-expanded='true'])) .bubble {
		visibility: hidden;
	}

	.tooltip:hover .bubble {
		transition: visibility 0s linear calc(var(--duration-short) * 2);
	}

	.tooltip:has(:global(:focus-visible)) .bubble,
	.tooltip:has(:global([aria-expanded='true'])) .bubble {
		transition: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.bubble {
			opacity: 0;
		}

		.tooltip:hover .bubble {
			opacity: 1;
			transition:
				opacity var(--duration-short) ease-out calc(var(--duration-short) * 2),
				visibility var(--duration-short) linear calc(var(--duration-short) * 2);
		}

		.tooltip:has(:global(:focus-visible)) .bubble {
			opacity: 1;
			transition:
				opacity var(--duration-short) ease-out,
				visibility var(--duration-short) linear;
		}

		.tooltip:has(:global([aria-expanded='true'])) .bubble {
			opacity: 0;
			transition: none;
		}
	}
</style>
