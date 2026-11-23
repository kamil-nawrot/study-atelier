<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		height?: number;
		staged?: boolean;
		children: Snippet;
	};

	let { height = $bindable(0), staged = false, children }: Props = $props();
</script>

<footer class="actions" class:staged data-action-bar bind:offsetHeight={height}>
	{@render children()}
</footer>

<style>
	.actions {
		position: sticky;
		bottom: 0;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-3);
		margin-top: auto;
		padding: var(--spacing-3) 0 calc(var(--spacing-3) + env(safe-area-inset-bottom));
	}

	.actions::before {
		content: '';
		position: absolute;
		inset: 0 calc(-1 * var(--form-actions-bleed, 0px));
		z-index: -1;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-surface);
	}

	.actions > :global(*) {
		flex: 1 1 auto;
	}

	.actions > :global(:first-child) {
		flex: none;
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
			margin-right: auto;
		}

		.staged {
			width: calc(100% + 2 * var(--content-bleed, 0px));
			translate: calc(-1 * var(--content-bleed, 0px));
			padding-inline: var(--spacing-12)
				max(
					min(var(--content-bleed, 0px), var(--spacing-12)),
					calc(50% + var(--content-bleed, 0px) - var(--spacing-12) - var(--size-content-default))
				);
		}
	}
</style>
