<script lang="ts">
	type Props = {
		lines?: number;
	};

	let { lines = 1 }: Props = $props();

	const WIDTHS = ['96%', '88%', '93%', '82%', '90%'];

	let widths = $derived(
		lines === 1
			? ['55%']
			: Array.from({ length: lines }, (_, index) =>
					index === lines - 1 ? '55%' : WIDTHS[index % WIDTHS.length]
				)
	);
</script>

<span class="filling-lines" aria-hidden="true">
	{#each widths as width, index (index)}
		<span style:width class="line"></span>
	{/each}
</span>

<style>
	.filling-lines {
		position: absolute;
		inset: var(--filling-inset, 0);
		display: grid;
		grid-auto-rows: calc(var(--line-height-md) * 1em);
		align-content: start;
		padding: var(--spacing-3);
		overflow: hidden;
		background: var(--color-surface);
		font-size: var(--font-size-md);
		pointer-events: none;
		animation: appear 0s var(--duration-loading-delay) both;
	}

	.line {
		align-self: center;
		height: 0.6em;
		background: color-mix(in srgb, currentColor 10%, transparent);
	}

	@keyframes appear {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.line {
			animation: pulse 1.8s ease-in-out infinite alternate;
		}
	}

	@keyframes pulse {
		from {
			opacity: 1;
		}

		to {
			opacity: 0.45;
		}
	}
</style>
