<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		height?: number;
		children: Snippet;
	};

	let { height = $bindable(0), children }: Props = $props();
</script>

<footer class="actions" data-action-bar bind:offsetHeight={height}>
	{@render children()}
</footer>

<style>
	.actions {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-3);
		margin-top: auto;
		padding: var(--spacing-3) 0;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.actions > :global(*) {
		flex: 1 1 auto;
	}

	.actions > :global(:first-child) {
		order: 3;
		flex-basis: 100%;
	}

	@media (min-width: 768px) {
		.actions {
			justify-content: flex-end;
			padding: var(--spacing-4) 0;
		}

		.actions > :global(*) {
			flex: none;
		}

		.actions > :global(:first-child) {
			order: 0;
			flex-basis: auto;
			margin-right: auto;
		}
	}
</style>
