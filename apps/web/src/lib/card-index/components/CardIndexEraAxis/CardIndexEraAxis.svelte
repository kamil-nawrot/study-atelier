<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<ol class="eras">
	{@render children()}
</ol>

<style>
	.eras {
		position: relative;
		display: grid;
		gap: var(--spacing-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.eras::before {
		content: '';
		position: absolute;
		top: var(--spacing-6);
		bottom: var(--spacing-6);
		left: var(--spacing-6);
		border-left: var(--border-width-hairline) solid var(--color-line);
	}
</style>
