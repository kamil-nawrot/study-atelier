<script lang="ts">
	import { uiMessages } from '../messages';

	type Props = {
		label?: string;
	};

	let { label = uiMessages().loading }: Props = $props();
</script>

<span class="progress" aria-label={label} role="progressbar"></span>

<style>
	.progress {
		position: absolute;
		inset-inline: 0;
		bottom: calc(var(--border-width-hairline) * -1);
		height: var(--border-width-base);
		background: linear-gradient(90deg, transparent, var(--color-fg), transparent) no-repeat;
		background-size: 40% 100%;
		animation:
			appear 0s var(--duration-loading-delay) both,
			travel 1.4s ease-in-out var(--duration-loading-delay) infinite;
	}

	@keyframes appear {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes travel {
		from {
			background-position: -40% 0;
		}

		to {
			background-position: 140% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress {
			background-size: 100% 100%;
			animation: appear 0s var(--duration-loading-delay) both;
		}
	}
</style>
