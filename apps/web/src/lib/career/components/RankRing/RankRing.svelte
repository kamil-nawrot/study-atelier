<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		progress: number;
		children: Snippet;
	};

	let { progress, children }: Props = $props();
</script>

<span style:--progress="{Math.min(Math.max(progress, 0), 1) * 100}%" class="ring">
	{@render children()}
</span>

<style>
	.ring {
		display: grid;
		padding: var(--border-width-base);
		background: conic-gradient(
			var(--color-case-gold) var(--progress),
			var(--color-fg) var(--progress)
		);
	}

	.ring > :global(.avatar) {
		border: none;
	}
</style>
