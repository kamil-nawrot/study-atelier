<script lang="ts">
	type Props = {
		shown: boolean;
		flash: number;
	};

	let { shown, flash }: Props = $props();
</script>

{#if shown}
	{#key flash}
		<span class="mark" class:flash={flash > 0} aria-hidden="true"></span>
	{/key}
{/if}

<style>
	.mark {
		position: absolute;
		top: calc(-1 * var(--spacing-1));
		right: calc(-1 * var(--spacing-1));
		width: var(--spacing-2);
		height: var(--spacing-2);
		background: var(--color-case-gold);
	}

	@media (prefers-reduced-motion: no-preference) {
		.flash {
			animation: glint calc(var(--duration-short) * 8) ease-out;
		}
	}

	@keyframes glint {
		from {
			opacity: 0;
			transform: scale(4);
		}

		40% {
			opacity: 1;
		}

		to {
			transform: scale(1);
		}
	}
</style>
