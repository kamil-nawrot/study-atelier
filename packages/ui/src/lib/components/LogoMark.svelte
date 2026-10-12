<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		label?: string;
		children?: Snippet;
	};

	let { size = 'md', label, children }: Props = $props();
</script>

<svg
	class="mark {size}"
	aria-hidden={label ? undefined : 'true'}
	aria-label={label}
	fill="currentColor"
	role={label ? 'img' : undefined}
	viewBox="0 0 32 32"
>
	<path d="M0 0H32V32H0Z M4 4V24H28V4Z" fill-rule="evenodd" />
	{#if children}
		<svg height="20" overflow="hidden" viewBox="0 0 24 20" width="24" x="4" y="4">
			{@render children()}
		</svg>
	{/if}
</svg>

<style>
	.mark {
		display: block;
		flex: none;
	}

	.sm {
		width: var(--spacing-6);
		height: var(--spacing-6);
	}

	.md {
		width: var(--spacing-8);
		height: var(--spacing-8);
	}

	.lg {
		width: var(--spacing-16);
		height: var(--spacing-16);
	}

	.xl {
		width: var(--spacing-24);
		height: var(--spacing-24);
	}
</style>
