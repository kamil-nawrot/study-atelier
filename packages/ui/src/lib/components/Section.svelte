<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLElement> & {
		as?: 'section' | 'article' | 'aside' | 'div';
		children: Snippet;
	};

	let { as = 'section', children, ...rest }: Props = $props();
</script>

<svelte:element this={as} class="section" {...rest}>
	{@render children()}
</svelte:element>

<style>
	.section {
		display: grid;
		gap: var(--spacing-2);
		padding: var(--spacing-1) 0 var(--spacing-1) var(--spacing-4);
		border-left: var(--border-width-heavy) solid var(--color-line);
	}
</style>
