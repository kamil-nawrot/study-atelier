<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<div class="stub">
	{@render children()}
</div>

<style>
	.stub {
		--period: 32px;
		--depth: 14px;
		--teeth-across: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 14' preserveAspectRatio='none'%3E%3Cpolygon points='0,14 16,0 32,14'/%3E%3C/svg%3E");
		--teeth-down: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 32' preserveAspectRatio='none'%3E%3Cpolygon points='14,0 0,16 14,32'/%3E%3C/svg%3E");

		position: relative;
		display: grid;
		align-items: center;
		min-width: 0;
		min-height: calc(var(--spacing-16) + var(--depth));
		padding: calc(var(--spacing-4) + var(--depth)) var(--spacing-6) var(--spacing-4);
		background: var(--color-surface);
		mask:
			var(--teeth-across) left top / var(--period) var(--depth) repeat-x,
			linear-gradient(currentColor, currentColor) left var(--depth) / 100% calc(100% - var(--depth))
				no-repeat;
	}

	@media (min-width: 768px) {
		.stub {
			min-height: 0;
			padding: var(--spacing-8) var(--spacing-8) var(--spacing-8)
				calc(var(--spacing-8) + var(--depth));
			mask:
				var(--teeth-down) left top / var(--depth) var(--period) repeat-y,
				linear-gradient(currentColor, currentColor) var(--depth) top / calc(100% - var(--depth))
					100% no-repeat;
		}
	}
</style>
