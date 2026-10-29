<script lang="ts">
	type Props = {
		direction: 'horizontal' | 'vertical';
	};

	let { direction }: Props = $props();
</script>

<div class="coat {direction}"></div>

<style>
	.coat {
		position: absolute;
		inset: 0;
		mask-image: var(--band), var(--band), var(--band), var(--band);
		mask-repeat: no-repeat;
		mask-size: 100% 100%;
	}

	.horizontal {
		background: repeating-linear-gradient(180deg, var(--bristles));
		mask-position:
			0 0,
			100% 33.333%,
			0 66.667%,
			100% 100%;
	}

	.vertical {
		background: repeating-linear-gradient(90deg, var(--bristles));
		mask-position:
			0 0,
			33.333% 100%,
			66.667% 0,
			100% 100%;
	}

	@media (prefers-reduced-motion: no-preference) {
		.horizontal {
			animation: horizontal-coat 5.6s linear infinite;
		}

		.vertical {
			animation: vertical-coat 5.6s linear infinite;
		}
	}

	@keyframes horizontal-coat {
		0%,
		3% {
			mask-size:
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		11%,
		12% {
			mask-size:
				100% var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		20%,
		21% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		29%,
		30% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width),
				0 var(--band-width);
		}

		38%,
		99.9% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width);
		}

		100% {
			mask-size:
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}
	}

	@keyframes vertical-coat {
		0%,
		40% {
			mask-size:
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		48%,
		49% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		57%,
		58% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		66%,
		67% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 0;
		}

		75%,
		99.9% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%;
		}

		100% {
			mask-size:
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}
	}
</style>
