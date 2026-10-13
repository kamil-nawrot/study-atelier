<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		text: string;
		children: Snippet<[string]>;
	};

	let { text, children }: Props = $props();

	const id = $props.id();
</script>

<span class="tooltip">
	{@render children(id)}
	<span {id} class="bubble" role="tooltip">{text}</span>
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

	.tooltip:hover .bubble,
	.tooltip:focus-within .bubble {
		visibility: visible;
	}
</style>
